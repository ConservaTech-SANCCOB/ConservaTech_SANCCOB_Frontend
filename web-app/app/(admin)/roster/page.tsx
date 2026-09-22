"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { fetchVolunteers, Volunteer } from "../../lib/api/volunteers";
import { fetchShiftsForWeek, Shift } from "../../lib/api/shifts";
import {
  fetchWeeklyRoster,
  generateAutomatedRoster,
  publishRoster,
  Roster,
  RosterAssignment,
} from "../../lib/api/roster";

// Helper: Get Monday of the current or given week (YYYY-MM-DD)
function getMonday(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

// Helper: Format range label (e.g., "17–23 Aug 2026")
function formatWeekRange(mondayDate: Date): string {
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  const startDay = mondayDate.getDate();
  const endDay = sundayDate.getDate();
  const monthStr = mondayDate.toLocaleDateString("en-US", { month: "short" });
  const yearStr = mondayDate.getFullYear();

  return `${startDay}–${endDay} ${monthStr} ${yearStr}`;
}

export default function RosterPage() {
  const { token } = useAuth();

  // Tab State: "view" | "generate"
  const [activeTab, setActiveTab] = useState<"view" | "generate">("view");

  // Dynamic Week State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday());

  // Shared Data States
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  // Full roster object (not just assignments) so we always have rosterId for publish.
  const [roster, setRoster] = useState<Roster | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const assignments: RosterAssignment[] = roster?.assignments ?? [];

  // Wizard States
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Volunteer[]>([]);
  const [expandedSection, setExpandedSection] = useState<"volunteers" | "shifts" | null>("volunteers");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Fetch data whenever week or token changes
  useEffect(() => {
    async function loadRosterData() {
      if (!token) return;
      try {
        setIsLoading(true);
        const weekStr = formatDateISO(currentWeekStart);

        const [vData, sData, rData] = await Promise.all([
          fetchVolunteers(token),
          fetchShiftsForWeek(token, weekStr),
          // No roster exists yet for this week -> backend 404s. That's expected,
          // not an error, so we swallow it and just show an empty roster.
          fetchWeeklyRoster(token, weekStr).catch(() => null),
        ]);

        setVolunteers(vData);
        setSelectedVolunteers(vData);
        setShifts(sData);
        setRoster(rData);
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

  // Exclude volunteer from generation
  // NOTE: this only affects the on-screen "pool" list. The real
  // POST /api/Rosters/generate endpoint has no field to exclude volunteers,
  // so this exclusion is NOT sent to the backend yet (see roster.ts).
  const handleRemoveVolunteer = (id: string) => {
    setSelectedVolunteers((prev) => prev.filter((v) => v.id !== id));
  };

  // Trigger Generation
  const handleStartGeneration = async () => {
    if (!token) return;
    setIsGenerating(true);
    setGenerationProgress(15);

    const interval = setInterval(() => {
      setGenerationProgress((prev) => (prev >= 90 ? 90 : prev + 25));
    }, 300);

    if (selectedVolunteers.length < volunteers.length) {
      console.warn(
        "[roster] Excluded volunteers were selected in the UI, but POST /api/Rosters/generate " +
          "does not support excluding volunteers yet — generation will consider the full pool."
      );
    }

    try {
      const weekStr = formatDateISO(currentWeekStart);
      const result = await generateAutomatedRoster(token, { weekStartDate: weekStr });

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
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Roster Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View scheduled assignments or generate new automated rosters
        </p>
      </div>

      {/* Pill Navigation Tabs */}
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

      {/* TAB 1: WEEKLY ROSTER VIEW */}
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
              onClick={() => setActiveTab("generate")}
              className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
            >
              ⚡ Generate Roster
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Shifts" value={totalShiftCount} />
            <StatCard label="Filled Shifts" value={filledCount} color="text-emerald-600" />
            <StatCard label="Unfilled Shifts" value={unfilledCount} color="text-red-600" />
            <StatCard label="Volunteers Scheduled" value={scheduledVolunteerCount} color="text-blue-700" />
          </div>

          {/* Roster Calendar Matrix */}
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

      {/* TAB 2: GENERATE ROSTER WIZARD */}
      {activeTab === "generate" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
          {/* Header with Weekly Picker */}
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

          {/* STEP 1: REVIEW INPUTS */}
          {step === 1 && !isGenerating && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-3 rounded-xl">
                Generating roster for <span className="font-bold">{weekLabel}</span> based on availability and skill rules.
              </div>

              {selectedVolunteers.length < volunteers.length && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl">
                  Heads up: excluding volunteers here is not yet supported by the backend
                  (<code>POST /api/Rosters/generate</code> only accepts a week). Generation will
                  still consider every volunteer in the pool.
                </div>
              )}

              {/* Input Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Volunteers Available" value={selectedVolunteers.length} />
                <StatCard label="Shifts Scheduled" value={shifts.length} />
                <StatCard label="Selected Target Week" value={weekLabel} isText />
              </div>

              {/* ACCORDION 1: VOLUNTEERS WITH (-) BUTTON */}
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
                    {selectedVolunteers.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0B2447] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {v.initials}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{v.name}</p>
                            <p className="text-[10px] text-slate-400">{v.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveVolunteer(v.id)}
                          className="w-6 h-6 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 flex items-center justify-center font-bold text-sm transition-all"
                          title="Exclude volunteer"
                        >
                          −
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ACCORDION 2: SHIFTS */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === "shifts" ? null : "shifts")}
                  className="w-full bg-slate-50/80 px-5 py-3.5 flex items-center justify-between font-bold text-slate-800 text-sm hover:bg-slate-100 transition-colors"
                >
                  <span>Shifts Scheduled ({shifts.length})</span>
                  <span>{expandedSection === "shifts" ? "▲" : "▼"}</span>
                </button>

                {expandedSection === "shifts" && (
                  <div className="p-5 bg-white text-xs text-slate-500">
                    Loaded {shifts.length} facility shift{shifts.length === 1 ? "" : "s"} for week of {weekLabel}.
                  </div>
                )}
              </div>

              {/* Action Button */}
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

          {/* GENERATION PROGRESS OVERLAY */}
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

          {/* STEP 2: GENERATE & REVIEW */}
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
              <RosterMatrix volunteers={selectedVolunteers} assignments={assignments} mondayDate={currentWeekStart} />

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

      {/* PUBLISH MODAL */}
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

/* ============================================================
   SHARED COMPONENTS
   ============================================================ */

function StatCard({ label, value, color = "text-slate-900", isText = false }: { label: string; value: number | string; color?: string; isText?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className={`font-bold ${isText ? "text-sm text-slate-800" : "text-2xl " + color}`}>{value}</p>
    </div>
  );
}

function RosterMatrix({
  volunteers,
  assignments,
  mondayDate,
}: {
  volunteers: Volunteer[];
  assignments: RosterAssignment[];
  mondayDate: Date;
}) {
  // Generate Mon-Fri labels + ISO date keys based on selected mondayDate
  const days = [0, 1, 2, 3, 4].map((offset) => {
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
  // NOTE: comparing as strings since Volunteer.id's exact type wasn't visible
  // when this was written — confirm it matches RosterAssignment.userId (number)
  // and simplify this comparison once verified.
  const assignedUserIds = new Set(assignments.map((a) => String(a.userId)));
  const rosteredVolunteers = volunteers.filter((v) => assignedUserIds.has(String(v.id)));

  function findAssignment(volunteerId: Volunteer["id"], iso: string): RosterAssignment | undefined {
    return assignments.find((a) => String(a.userId) === String(volunteerId) && a.shiftDate === iso);
  }

  return (
    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
          <tr>
            <th className="py-3 px-4">Volunteer</th>
            {days.map((d) => (
              <th key={d.iso} className="py-3 px-4">{d.dayName} {d.dayNum}</th>
            ))}
          </tr>
        </thead>
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