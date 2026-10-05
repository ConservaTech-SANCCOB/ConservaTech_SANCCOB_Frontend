"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { fetchVolunteers, Volunteer } from "../../lib/api/volunteers";
import { fetchShiftsForWeek, fetchVacanciesForWeek, Shift, Vacancy } from "../../lib/api/shifts";
import {
  fetchWeeklyRoster,
  fetchGenerationPool,
  generateAutomatedRoster,
  publishRoster,
  Roster,
  RosterAssignment,
  RosterGenerationVolunteer,
} from "../../lib/api/roster";

// Helper: Get Monday of the current or given week, normalized to local
// midnight. Normalizing here (rather than leaving whatever time-of-day the
// Date was created at) is what makes formatDateISO's UTC-free conversion
// safe below.

//-----------------------------------------------------------------------------------------------//
//<summary>
// Gets the Monday for the current or supplied week and normalizes it to local midnight.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function getMonday(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

//<summary>
// Formats a Date using its local calendar fields as YYYY-MM-DD without converting through UTC.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper: Format range label (e.g., "17–23 Aug 2026")
//-----------------------------------------------------------------------------------------------//
//<summary>
// Creates the human-readable Monday-to-Sunday label displayed by the roster week selectors.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function formatWeekRange(mondayDate: Date): string {
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  const startDay = mondayDate.getDate();
  const endDay = sundayDate.getDate();
  const monthStr = mondayDate.toLocaleDateString("en-US", { month: "short" });
  const yearStr = mondayDate.getFullYear();

  return `${startDay}–${endDay} ${monthStr} ${yearStr}`;
}

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Main roster management page containing the weekly roster view and automated roster generation workflow.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export default function RosterPage() {
  const { token } = useAuth();

  // Tab State: "view" | "generate"
  const [activeTab, setActiveTab] = useState<"view" | "generate">("view");

  // Dynamic Week State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday());

  // Shared Data States
  // Full volunteer list. Not the generation pool: it is kept so RosterMatrix
  // can look up each assigned volunteer's name and initials.
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  // Only used to show "X volunteers assigned" per shift card below. Fetched
  // separately because /api/Vacancies never returns a shift that's already
  // fully booked (see shiftAssignedInfo()).
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  // Full roster object (not just assignments) so we always have rosterId for publish.
  const [roster, setRoster] = useState<Roster | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const assignments: RosterAssignment[] = roster?.assignments ?? [];

  // Wizard States
  const [step, setStep] = useState<1 | 2>(1);
  // Week-scoped pool from GET /api/Rosters/generation-pool  NOT the full
  // volunteers.ts list. `selectedVolunteers` means "currently included in
  // this generation run"; the minus button removes someone from this list,
  // matching the real includedVolunteerIds payload direction (see roster.ts).
  const [selectedVolunteers, setSelectedVolunteers] = useState<RosterGenerationVolunteer[]>([]);
  const [expandedSection, setExpandedSection] = useState<"volunteers" | "shifts" | null>("volunteers");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  // Confirm before jumping from the Weekly Roster tab into the Generate flow 
  // that tab has no review step of its own, unlike the Generate tab's own
  // "Generate Roster for {weekLabel}" button, which already sits behind
  // Step 1 (Review Inputs).
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);

  // Fetch data whenever week or token changes
  useEffect(() => {
    async function loadRosterData() {
      if (!token) return;
      try {
        setIsLoading(true);
        const weekStr = formatDateISO(currentWeekStart);

        const [vData, poolData, sData, rData, vacData] = await Promise.all([
          // Full list, used by RosterMatrix for names and initials.
          fetchVolunteers(token),
          // Volunteers eligible for generation in this specific week.
          fetchGenerationPool(token, weekStr),
          fetchShiftsForWeek(token, weekStr),
          // No roster exists yet for this week -> backend 404s. That's expected,
          // not an error, so we swallow it and just show an empty roster.
          fetchWeeklyRoster(token, weekStr).catch(() => null),
          // Don't let a vacancies hiccup break the whole page the assigned
          // count on each shift card just falls back to "fully assigned".
          fetchVacanciesForWeek(token, weekStr).catch(() => []),
        ]);

        setVolunteers(vData);
        setSelectedVolunteers(poolData);
        setShifts(sData);
        setRoster(rData);
        setVacancies(vacData);
      } catch (err) {
        console.error("Failed to load roster data for week", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRosterData();
  }, [token, currentWeekStart]);

  // Week Navigation Handlers (+/- 7 days)
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  // Remove volunteer from this generation run. Now REAL — whoever remains in
  // `selectedVolunteers` becomes the `includedVolunteerIds` sent to the
  // backend (see handleStartGeneration below).
  const handleRemoveVolunteer = (userId: number) => {
    setSelectedVolunteers((prev) => prev.filter((v) => v.userId !== userId));
  };

  // Trigger Generation
  const handleStartGeneration = async () => {
    if (!token) return;
    setIsGenerating(true);
    setGenerationProgress(15);

    // Progress bar is cosmetic: it climbs to 90% while the request runs,
    // then jumps to 100% once the backend responds.
    const interval = setInterval(() => {
      setGenerationProgress((prev) => (prev >= 90 ? 90 : prev + 25));
    }, 300);

    try {
      const weekStr = formatDateISO(currentWeekStart);
      const result = await generateAutomatedRoster(token, {
        weekStartDate: weekStr,
        includedVolunteerIds: selectedVolunteers.map((v) => v.userId),
      });

      setRoster(result);
      setGenerationProgress(100);
      setTimeout(() => {
        clearInterval(interval);
        setIsGenerating(false);
        setStep(2);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setIsGenerating(false);
      console.error("Failed to generate roster", err);
      alert("Failed to generate roster for the selected week.");
    }
  };

  // Handle Publish
  const handlePublishRoster = async () => {
    if (!token) return;
    if (!roster?.rosterId) {
      setPublishError("No roster has been generated for this week yet — nothing to publish.");
      return;
    }
    try {
      setPublishError(null);
      const published = await publishRoster(token, roster.rosterId);
      setRoster(published);
      alert("Roster published successfully!");
      setIsPublishModalOpen(false);
      setActiveTab("view");
    } catch (err) {
      console.error("Failed to publish roster", err);
      setPublishError("Unable to publish roster. Please verify the backend service.");
    }
  };

  const weekLabel = formatWeekRange(currentWeekStart);

  const filledCount = assignments.length;
  const totalShiftCount = shifts.length;
  const unfilledCount = Math.max(totalShiftCount - filledCount, 0);
  // Distinct volunteers actually on this week's roster (not just the pool).
  const scheduledVolunteerCount = new Set(assignments.map((a) => a.userId)).size;

  return (
    <div className="space-y-6">
      {/*------------------------------------ Page Header ----------------------------------------------------*/}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Roster Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View scheduled assignments or generate new automated rosters
        </p>
      </div>

      {/*------------------------------------ Pill Navigation Tabs ----------------------------------------------------*/}

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setActiveTab("view");
            setStep(1);
          }}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "view"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Weekly Roster
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "generate"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Generate Roster
        </button>
      </div>

      {/*------------------------------------ Weekly Roster View ----------------------------------------------------*/}

      {activeTab === "view" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
          {/* Top Controls with Weekly Picker */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden p-0.5">
                <button
                  onClick={handlePrevWeek}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg font-bold text-xs transition-colors"
                >
                  ‹
                </button>
                <span className="text-xs font-bold text-slate-800 px-3 py-1">
                  {weekLabel}
                </span>
                <button
                  onClick={handleNextWeek}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg font-bold text-xs transition-colors"
                >
                  ›
                </button>
              </div>
              {/* Roster status badge: Published (green), generated but unpublished (amber), none (grey) */}
              {!isLoading && (
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    roster
                      ? roster.status === "Published"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-slate-500 bg-slate-50 border-slate-200"
                  }`}
                >
                  {roster ? roster.status ?? "Needs Review" : "No Roster Generated"}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsGenerateConfirmOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
            >
              ⚡ Generate Roster
            </button>
          </div>

          {/*------------------------------------ Roster Statistics ----------------------------------------------------*/}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Shifts" value={totalShiftCount} />
            <StatCard label="Filled Shifts" value={filledCount} color="text-emerald-600" />
            <StatCard label="Unfilled Shifts" value={unfilledCount} color="text-red-600" />
            <StatCard label="Volunteers Scheduled" value={scheduledVolunteerCount} color="text-blue-700" />
          </div>

          {/*------------------------------------ Roster Calendar Matrix ----------------------------------------------------*/}

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading week roster…</div>
          ) : !roster ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No roster has been generated for {weekLabel} yet.
            </div>
          ) : (
            <RosterMatrix volunteers={volunteers} assignments={assignments} mondayDate={currentWeekStart} />
          )}
        </div>
      )}

      {/*------------------------------------ Generate Roster Wizard ----------------------------------------------------*/}

      {activeTab === "generate" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
          {/*------------------------------------ Generate Wizard Header ----------------------------------------------------*/}

          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Generate Roster</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Week of:</span>
                <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-lg overflow-hidden px-1 py-0.5">
                  <button
                    onClick={handlePrevWeek}
                    className="px-1.5 text-slate-500 hover:text-slate-800 font-bold text-xs"
                  >
                    ‹
                  </button>
                  <span className="text-xs font-bold text-slate-800 px-2">{weekLabel}</span>
                  <button
                    onClick={handleNextWeek}
                    className="px-1.5 text-slate-500 hover:text-slate-800 font-bold text-xs"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            {/* Step indicator: current step is blue, completed step is green */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={`px-3 py-1 rounded-full ${step === 1 ? "bg-blue-700 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                1. Review Inputs
              </span>
              <span className="text-slate-300">→</span>
              <span className={`px-3 py-1 rounded-full ${step === 2 ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-400"}`}>
                2. Generate & Review
              </span>
            </div>
          </div>

          {/*------------------------------------ Step 1: Review Inputs ----------------------------------------------------*/}

          {step === 1 && !isGenerating && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-3 rounded-xl">
                Generating roster for <span className="font-bold">{weekLabel}</span> based on availability and skill rules.
              </div>

              {/*------------------------------------ Input Statistics ----------------------------------------------------*/}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Volunteers Available" value={selectedVolunteers.length} />
                <StatCard label="Shifts Scheduled" value={shifts.length} />
                <StatCard label="Selected Target Week" value={weekLabel} isText />
              </div>

              {/*------------------------------------ Volunteer Pool ----------------------------------------------------*/}

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === "volunteers" ? null : "volunteers")}
                  className="w-full bg-slate-50/80 px-5 py-3.5 flex items-center justify-between font-bold text-slate-800 text-sm hover:bg-slate-100 transition-colors"
                >
                  <span>Volunteers Pool ({selectedVolunteers.length})</span>
                  <span>{expandedSection === "volunteers" ? "▲" : "▼"}</span>
                </button>

                {expandedSection === "volunteers" && (
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-white">
                    {selectedVolunteers.map((v) => {
                      // The pool items only carry firstName / lastName / email,
                      // so the display name and initials are built here.
                      const name = `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || v.email || "Volunteer";
                      const initials =
                        ((v.firstName?.charAt(0) ?? "") + (v.lastName?.charAt(0) ?? "")).toUpperCase() ||
                        name.charAt(0).toUpperCase();
                      return (
                        <div
                          key={v.userId}
                          className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3 hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0B2447] text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{name}</p>
                              <p className="text-[10px] text-slate-400">{v.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveVolunteer(v.userId)}
                            className="w-6 h-6 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 flex items-center justify-center font-bold text-sm transition-all"
                            title="Remove from this generation run"
                          >
                            −
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/*------------------------------------ Scheduled Shifts ----------------------------------------------------*/}

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === "shifts" ? null : "shifts")}
                  className="w-full bg-slate-50/80 px-5 py-3.5 flex items-center justify-between font-bold text-slate-800 text-sm hover:bg-slate-100 transition-colors"
                >
                  <span>Shifts Scheduled ({shifts.length})</span>
                  <span>{expandedSection === "shifts" ? "▲" : "▼"}</span>
                </button>

                {expandedSection === "shifts" && (
                  <div className="p-5 bg-white space-y-2">
                    {shifts.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        No shifts scheduled for {weekLabel}.
                      </p>
                    ) : (
                      // Sorted by date, then by time slot, before rendering
                      [...shifts]
                        .sort((a, b) =>
                          a.shiftDate === b.shiftDate
                            ? a.timeSlot.localeCompare(b.timeSlot)
                            : a.shiftDate.localeCompare(b.shiftDate)
                        )
                        .map((s) => (
                          <ShiftDetailCard
                            key={s.shiftId}
                            shift={s}
                            assignedInfo={shiftAssignedInfo(s, vacancies)}
                          />
                        ))
                    )}
                  </div>
                )}
              </div>

              {/*------------------------------------ Generation Action ----------------------------------------------------*/}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleStartGeneration}
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors flex items-center gap-2"
                >
                  ⚡ Generate Roster for {weekLabel}
                </button>
              </div>
            </div>
          )}

          {/*------------------------------------ Generation Progress ----------------------------------------------------*/}

          {isGenerating && (
            <div className="py-20 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">Generating roster for {weekLabel}...</h3>
              <p className="text-xs text-slate-500">Optimising shift assignments...</p>
              <div className="w-64 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-blue-700 transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-slate-400">{generationProgress}%</p>
            </div>
          )}

          {/*------------------------------------ Step 2: Generate & Review ----------------------------------------------------*/}

          {step === 2 && !isGenerating && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
                <span>✓ Roster Generated for {weekLabel} — Review assignments before publishing.</span>
              </div>

              {/* 3 Grid Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Shifts Filled" value={filledCount} color="text-emerald-600" />
                <StatCard label="Shifts Remaining" value={unfilledCount} color="text-red-600" />
                <StatCard label="Volunteers Assigned" value={scheduledVolunteerCount} color="text-blue-700" />
              </div>

              {/* Roster Matrix */}
              {/* Full volunteers list (has name/initials already computed), not
                  the generation-pool selection the matrix filters down to
                  whoever actually has an assignment. */}
              <RosterMatrix volunteers={volunteers} assignments={assignments} mondayDate={currentWeekStart} />

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ← Back to Review Inputs
                </button>
                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors"
                >
                  Publish Roster
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/*------------------------------------ Generate Confirm Modal (Weekly Roster tab only) ----------------------------------------------------*/}

      {isGenerateConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setIsGenerateConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Generate roster for {weekLabel}?</h2>
              <button
                onClick={() => setIsGenerateConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {roster
                ? "A roster already exists for this week. You'll be taken to Review Inputs to check the volunteer pool and shifts before generating again."
                : "You'll be taken to Review Inputs to check the volunteer pool and shifts before anything is generated."}
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsGenerateConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsGenerateConfirmOpen(false);
                  setStep(1);
                  setActiveTab("generate");
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/*------------------------------------ Publish Modal ----------------------------------------------------*/}

      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setIsPublishModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Publish roster for {weekLabel}?</h2>
              <button onClick={() => setIsPublishModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <p className="text-xs text-slate-500">
              Once published, volunteers will be notified on the mobile app.
            </p>

            {publishError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                {publishError}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <p className="text-[10px] text-slate-400">Total Shifts</p>
                <p className="text-lg font-bold text-slate-800">{totalShiftCount}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl text-center">
                <p className="text-[10px] text-emerald-600">Filled</p>
                <p className="text-lg font-bold text-emerald-700">{filledCount}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl text-center">
                <p className="text-[10px] text-red-600">Unfilled</p>
                <p className="text-lg font-bold text-red-700">{unfilledCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishRoster}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                Publish Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Maps the three known VALID_TIME_SLOTS values (shifts.ts) to a session
// label, matching how the mobile app groups shifts under "Morning" etc.
// Falls back to the raw string for anything unrecognised rather than
// guessing, per the project's "don't invent values" convention.
//-----------------------------------------------------------------------------------------------//
//<summary>
// Converts a supported shift time slot into the session label shown in the roster UI.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function shiftSessionLabel(timeSlot: string): string {
  switch (timeSlot) {
    case "08:00-13:00":
      return "Morning";
    case "14:00-17:00":
      return "Afternoon";
    case "08:00-17:00":
      return "Full Day";
    default:
      return timeSlot;
  }
}

// /api/Vacancies never returns a shift with 0 remaining capacity, so a shift
// with no matching vacancy entry is treated as fully assigned same default
// used elsewhere in this project for that gap.
//-----------------------------------------------------------------------------------------------//
//<summary>
// Determines the assigned volunteer count and capacity for a shift using the available vacancy data.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function shiftAssignedInfo(
  shift: Shift,
  vacancies: Vacancy[]
): { assigned: number; capacity: number } {
  const match = vacancies.find((v) => v.shiftId === shift.shiftId);
  if (match) {
    return { assigned: match.assignedVolunteers, capacity: match.capacity };
  }
  return { assigned: shift.capacity, capacity: shift.capacity };
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Renders the date, session, location, and volunteer capacity information for one scheduled shift.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function ShiftDetailCard({
  shift,
  assignedInfo,
}: {
  shift: Shift;
  assignedInfo: { assigned: number; capacity: number };
}) {
  // Parsed as local midnight ("T00:00:00") so the day number and weekday
  // can't slip a day in timezones ahead of UTC.
  const date = new Date(`${shift.shiftDate.slice(0, 10)}T00:00:00`);
  const dayNum = date.getDate();
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const isFull = assignedInfo.assigned >= assignedInfo.capacity;

  return (
    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
      {/* Date tile */}
      <div className="w-14 h-14 rounded-xl bg-blue-700 text-white flex flex-col items-center justify-center shrink-0">
        <span className="text-lg font-bold leading-none">{dayNum}</span>
        <span className="text-[10px] font-semibold leading-none mt-1">{dayName}</span>
      </div>

      {/* Session, time slot and location */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">
          {shiftSessionLabel(shift.timeSlot)}{" "}
          <span className="font-normal text-slate-400">· {shift.timeSlot}</span>
        </p>
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
          <LocationIcon className="w-3.5 h-3.5 shrink-0" />
          {shift.location}
        </p>
      </div>

      {/* Assigned / capacity badge: green when full, amber when places remain */}
      <div
        className={`text-right shrink-0 px-3 py-1.5 rounded-xl border ${
          isFull
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <p className={`text-sm font-bold ${isFull ? "text-emerald-700" : "text-amber-700"}`}>
          {assignedInfo.assigned}/{assignedInfo.capacity}
        </p>
        <p className={`text-[10px] ${isFull ? "text-emerald-600" : "text-amber-600"}`}>volunteers</p>
      </div>
    </div>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Renders the reusable location-pin SVG icon used by shift detail cards.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}


//-----------------------------------------------------------------------------------------------//
//<summary>
// Renders a compact statistic card used throughout the roster management interface.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function StatCard({ label, value, color = "text-slate-900", isText = false }: { label: string; value: number | string; color?: string; isText?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className={`font-bold ${isText ? "text-sm text-slate-800" : "text-2xl " + color}`}>{value}</p>
    </div>
  );
}

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Renders the weekly volunteer assignment matrix for Monday through Sunday.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function RosterMatrix({
  volunteers,
  assignments,
  mondayDate,
}: {
  volunteers: Volunteer[];
  assignments: RosterAssignment[];
  mondayDate: Date;
}) {
  // Generate Mon-Sun labels + ISO date keys based on selected mondayDate.
  // Was [0,1,2,3,4] (Mon-Fri only) — extended to 0-6 so Saturday and Sunday
  // render too.
  const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + offset);
    return {
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      iso: formatDateISO(d),
    };
  });

  // Only show volunteers who actually have at least one assignment this week,
  // so the table reflects the real roster rather than every volunteer in the pool.
  
  const assignedUserIds = new Set(assignments.map((a) => String(a.userId)));
  const rosteredVolunteers = volunteers.filter((v) => assignedUserIds.has(String(v.id)));

  // Finds the assignment (if any) for one volunteer on one day
  function findAssignment(volunteerId: Volunteer["id"], iso: string): RosterAssignment | undefined {
    return assignments.find((a) => String(a.userId) === String(volunteerId) && a.shiftDate === iso);
  }

  return (
    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
      <table className="w-full text-left text-xs">
        {/* Header row: volunteer column plus Monday to Sunday */}
        <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
          <tr>
            <th className="py-3 px-4">Volunteer</th>
            {days.map((d) => (
              <th key={d.iso} className="py-3 px-4">{d.dayName} {d.dayNum}</th>
            ))}
          </tr>
        </thead>
        {/* One row per rostered volunteer */}
        <tbody className="divide-y divide-slate-100">
          {rosteredVolunteers.length === 0 ? (
            <tr>
              <td colSpan={days.length + 1} className="py-8 px-4 text-center text-slate-400">
                No volunteers assigned this week.
              </td>
            </tr>
          ) : (
            rosteredVolunteers.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#0B2447] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {v.initials}
                    </div>
                    <span className="font-semibold text-slate-800">{v.name}</span>
                  </div>
                </td>
                {/* Day cells: the assignment card, or a dash if none */}
                {days.map((d) => {
                  const a = findAssignment(v.id, d.iso);
                  return (
                    <td key={d.iso} className="py-3.5 px-4">
                      {a ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-xl text-[11px] font-semibold space-y-0.5">
                          <p className="text-[10px] text-emerald-600">{a.timeSlot}</p>
                          <p>{a.location ?? "—"}</p>
                          {a.status && <p className="text-[10px] font-normal text-emerald-600">{a.status}</p>}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//