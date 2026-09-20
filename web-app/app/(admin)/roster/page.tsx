"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { fetchVolunteers, Volunteer } from "../../lib/api/volunteers";
import { fetchShiftsForWeek, Shift } from "../../lib/api/shifts";
import { fetchWeeklyRoster,
         generateAutomatedRoster,
         publishRoster, 
         RosterAssignment
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
  const [assignments, setAssignments] = useState<RosterAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wizard States
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Volunteer[]>([]);
  const [expandedSection, setExpandedSection] = useState<"volunteers" | "shifts" | null>("volunteers");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

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
          fetchWeeklyRoster(token, weekStr).catch(() => null),
        ]);

        setVolunteers(vData);
        setSelectedVolunteers(vData);
        setShifts(sData);
        if (rData && rData.assignments) {
          setAssignments(rData.assignments);
        } else {
          setAssignments([]);
        }
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
  const handleRemoveVolunteer = (id: string) => {
    setSelectedVolunteers((prev) => prev.filter((v) => v.id !== id));
  };

  // Trigger Generation
  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(15);

    const interval = setInterval(() => {
      setGenerationProgress((prev) => (prev >= 90 ? 90 : prev + 25));
    }, 300);

    try {
      const weekStr = formatDateISO(currentWeekStart);
      const excludedIds = volunteers
        .filter((v) => !selectedVolunteers.some((sv) => sv.id === v.id))
        .map((v) => v.id);

      const result = await generateAutomatedRoster(token, {
        weekStartDate: weekStr,
        excludedVolunteerIds: excludedIds,
      }).catch(() => null);

      if (result && result.assignments) {
        setAssignments(result.assignments);
      }

      setGenerationProgress(100);
      setTimeout(() => {
        clearInterval(interval);
        setIsGenerating(false);
        setStep(2);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setIsGenerating(false);
      alert("Failed to generate roster for the selected week.");
    }
  };

  // Handle Publish
  const handlePublishRoster = async () => {
    try {
      const weekStr = formatDateISO(currentWeekStart);
      await publishRoster(token, weekStr);
      alert("Roster published successfully!");
      setIsPublishModalOpen(false);
      setActiveTab("view");
    } catch (err) {
      alert("Unable to publish roster. Please verify backend service.");
    }
  };

  const weekLabel = formatWeekRange(currentWeekStart);

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
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                Needs Review
              </span>
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
            <StatCard label="Total Shifts" value={shifts.length || 24} />
            <StatCard label="Filled Shifts" value={assignments.length || 22} color="text-emerald-600" />
            <StatCard label="Unfilled Shifts" value={Math.max((shifts.length || 24) - assignments.length, 0)} color="text-red-600" />
            <StatCard label="Volunteers Scheduled" value={selectedVolunteers.length || 6} color="text-blue-700" />
          </div>

          {/* Roster Calendar Matrix */}
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading week roster…</div>
          ) : (
            <RosterMatrix volunteers={volunteers} mondayDate={currentWeekStart} />
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

              {/* Input Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Volunteers Available" value={selectedVolunteers.length} />
                <StatCard label="Shifts Scheduled" value={shifts.length || 24} />
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
                  <span>Shifts Scheduled ({shifts.length || 24})</span>
                  <span>{expandedSection === "shifts" ? "▲" : "▼"}</span>
                </button>

                {expandedSection === "shifts" && (
                  <div className="p-5 bg-white text-xs text-slate-500">
                    Loaded facility shifts for week of {weekLabel}.
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
                <StatCard label="Shifts Filled" value={22} color="text-emerald-600" />
                <StatCard label="Shifts Remaining" value={2} color="text-red-600" />
                <StatCard label="Volunteers Assigned" value={selectedVolunteers.length} color="text-blue-700" />
              </div>

              {/* Roster Matrix */}
              <RosterMatrix volunteers={selectedVolunteers} mondayDate={currentWeekStart} />

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

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <p className="text-[10px] text-slate-400">Total Shifts</p>
                <p className="text-lg font-bold text-slate-800">{shifts.length || 24}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl text-center">
                <p className="text-[10px] text-emerald-600">Filled</p>
                <p className="text-lg font-bold text-emerald-700">22</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl text-center">
                <p className="text-[10px] text-red-600">Unfilled</p>
                <p className="text-lg font-bold text-red-700">2</p>
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

function RosterMatrix({ volunteers, mondayDate }: { volunteers: Volunteer[]; mondayDate: Date }) {
  // Generate Mon-Fri labels based on selected mondayDate
  const days = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + offset);
    return {
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
    };
  });

  return (
    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
          <tr>
            <th className="py-3 px-4">Volunteer</th>
            <th className="py-3 px-4">Role / Area</th>
            {days.map((d) => (
              <th key={d.dayNum} className="py-3 px-4">{d.dayName} {d.dayNum}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {volunteers.slice(0, 5).map((v, idx) => (
            <tr key={v.id || idx} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0B2447] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {v.initials}
                  </div>
                  <span className="font-semibold text-slate-800">{v.name}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-slate-500 font-medium">Penguin Rehabilitation</td>
              <td className="py-3.5 px-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-xl text-[11px] font-semibold space-y-0.5">
                  <p className="text-[10px] text-emerald-600">08:00–13:00</p>
                  <p>Penguin Care ✓</p>
                </div>
              </td>
              <td className="py-3.5 px-4 text-slate-300">—</td>
              <td className="py-3.5 px-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-xl text-[11px] font-semibold space-y-0.5">
                  <p className="text-[10px] text-emerald-600">08:00–13:00</p>
                  <p>Penguin Care ✓</p>
                </div>
              </td>
              <td className="py-3.5 px-4 text-slate-300">—</td>
              <td className="py-3.5 px-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-xl text-[11px] font-semibold space-y-0.5">
                  <p className="text-[10px] text-emerald-600">08:00–13:00</p>
                  <p>Penguin Care ✓</p>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}