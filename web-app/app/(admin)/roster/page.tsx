"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { fetchVolunteers, Volunteer } from "../../lib/api/volunteers";
import { ApiError } from "../../lib/api/http";
import { fetchShiftsForWeek, fetchVacanciesForWeek, Shift, Vacancy } from "../../lib/api/shifts";
import {
  fetchWeeklyRoster,
  fetchGenerationPool,
  generateAutomatedRoster,
  publishRoster,
  deleteRoster,
  Roster,
  RosterAssignment,
  RosterGenerationVolunteer,
} from "../../lib/api/roster";
import {
  AssignVolunteerModal,
  RemoveAssignmentModal,
} from "../../../components/roster/AssignmentModals";
import { PenguinFace } from "../../../components/ui/penguin";
import { ICONS, LineIcon } from "../../../components/ui/line-icon";
import { buttonOutline, buttonPrimary, card, cardTitle } from "../../../components/ui/styles";

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

  const assignments: RosterAssignment[] = (roster?.assignments ?? []).filter(
  (a) => a.status?.toLowerCase() !== "vacant"
  );

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

  // Assignment CRUD modals: "add" assigns a volunteer to a shift, "swap"
  // replaces the volunteer on an existing assignment, and removeTarget is the
  // assignment currently being confirmed for removal.
  const [assignModal, setAssignModal] = useState<
    { mode: "add" } | { mode: "swap"; target: RosterAssignment } | null
  >(null);
  const [removeTarget, setRemoveTarget] = useState<RosterAssignment | null>(null);

  // Delete-roster confirm modal.
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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


// Refetch roster + vacancies after any add/remove/swap, so counts stay in sync.
// Only a 404 means "no roster for this week". Any other failure keeps the
// roster already on screen instead of wiping it.
const reloadRoster = async () => {
  if (!token) return;
  const weekStr = formatDateISO(currentWeekStart);
  try {
    const [rData, vacData] = await Promise.all([
      fetchWeeklyRoster(token, weekStr).catch((err) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }),
      fetchVacanciesForWeek(token, weekStr).catch(() => []),
    ]);
    setRoster(rData);
    setVacancies(vacData);
  } catch (err) {
    console.error("Failed to refresh roster", err);
  }
};

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
     setPublishError(
     err instanceof Error ? err.message : "Unable to publish roster. Please try again."
   );
    }
  };

  // Handle Delete Roster. Reloads from the backend afterwards, so the screen
  // shows whatever the backend really did (gone, or still returned).
  const handleDeleteRoster = async () => {
    if (!token || !roster?.rosterId) return;
    try {
      setDeleteError(null);
      setIsDeleting(true);
      await deleteRoster(token, roster.rosterId);
      await reloadRoster();
      setIsDeleteModalOpen(false);
      setStep(1);
    } catch (err) {
      console.error("Failed to delete roster", err);
      setDeleteError(
        err instanceof Error ? err.message : "Unable to delete roster. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const weekLabel = formatWeekRange(currentWeekStart);

  // A roster that is already Published can't be published again.

  const isPublished = roster?.status === "Published";
// A shift counts as filled only when its assigned volunteers reach its
// capacity. Assigned counts come from this roster's active assignments, so
// they stay accurate after add / remove / swap.
const assignedPerShift = new Map<number, number>();
assignments.forEach((a) => {
  assignedPerShift.set(a.shiftId, (assignedPerShift.get(a.shiftId) ?? 0) + 1);
});

const totalShiftCount = shifts.length;
const filledCount = shifts.filter(
  (s) => (assignedPerShift.get(s.shiftId) ?? 0) >= s.capacity
).length;
const unfilledCount = totalShiftCount - filledCount;
  // Distinct volunteers actually on this week's roster (not just the pool).
  const scheduledVolunteerCount = new Set(assignments.map((a) => a.userId)).size;

  return (
    <div className="space-y-6">
      {/*------------------------------------ Page Header ----------------------------------------------------*/}

      <div>
        <h1 className="text-3xl font-black text-ink-strong tracking-tight">Roster Management</h1>
        <p className="font-semibold text-ink-muted mt-1">
          View scheduled assignments or generate new automated rosters
        </p>
      </div>

      {/*------------------------------------ Pill Navigation Tabs ----------------------------------------------------*/}

      <div className="inline-flex items-center gap-1 bg-surface-sunken rounded-full p-1">
        <button
          onClick={() => {
            setActiveTab("view");
            setStep(1);
          }}
          className={`px-5 py-2.5 rounded-full font-extrabold transition-colors ${
            activeTab === "view"
              ? "bg-surface text-ink-strong shadow-sm border border-line"
              : "text-ink-muted hover:text-ink-strong"
          }`}
        >
          Weekly Roster
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-5 py-2.5 rounded-full font-extrabold transition-colors ${
            activeTab === "generate"
              ? "bg-surface text-ink-strong shadow-sm border border-line"
              : "text-ink-muted hover:text-ink-strong"
          }`}
        >
          Generate Roster
        </button>
      </div>

      {/*------------------------------------ Weekly Roster View ----------------------------------------------------*/}

      {activeTab === "view" && (
        <div className={`${card} p-6 space-y-6`}>
          {/* Top Controls with Weekly Picker */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-sunken border border-line rounded-full overflow-hidden p-1">
                <button
                  onClick={handlePrevWeek}
                  aria-label="Previous week"
                  className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink-strong hover:bg-tint rounded-full transition-colors"
                >
                  <LineIcon d={ICONS.chevronLeft} size={18} strokeWidth={2.6} />
                </button>
                <span className="font-black text-ink-strong px-3">
                  {weekLabel}
                </span>
                <button
                  onClick={handleNextWeek}
                  aria-label="Next week"
                  className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink-strong hover:bg-tint rounded-full transition-colors"
                >
                  <LineIcon d={ICONS.chevronRightSm} size={18} strokeWidth={2.6} />
                </button>
              </div>
              {/* Roster status badge: Published (green), generated but unpublished (amber), none (grey) */}
              {!isLoading && <RosterStatusBadge roster={roster} />}
            </div>

            {/* Action buttons: manual assignment (needs an existing roster) and automated generation */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setAssignModal({ mode: "add" })}
                disabled={!roster || shifts.length === 0}
                title={!roster ? "Generate a roster for this week first" : undefined}
                className={`${buttonOutline} !min-h-11 !px-4 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <LineIcon d={ICONS.personPlus} size={18} strokeWidth={2.2} />
                Assign Volunteer
              </button>
            {/* Publish an existing Draft without regenerating it */}
              {roster && !isPublished && (
                <button
                  onClick={() => {
                    setPublishError(null);
                    setIsPublishModalOpen(true);
                  }}
                  className={`${buttonPrimary} !min-h-11 !px-4`}
                >
                  <LineIcon d={ICONS.check} size={18} strokeWidth={2.6} />
                  Publish Roster
                </button>
              )}
              <button
                onClick={() => setIsGenerateConfirmOpen(true)}
                className={`${buttonPrimary} !min-h-11 !px-4`}
              >
                <LineIcon d={ICONS.bolt} size={18} strokeWidth={2.2} />
                Generate Roster
              </button>
              {/* Delete the whole roster (only when one exists) */}
              {roster && (
                <button
                  onClick={() => {
                    setDeleteError(null);
                    setIsDeleteModalOpen(true);
                  }}
                  className="min-h-11 px-4 rounded-full border-2 border-[#E2A39C] bg-surface text-[#B42318] font-extrabold inline-flex items-center gap-2 hover:bg-urgent transition-colors"
                >
                  <LineIcon d={ICONS.trash} size={18} strokeWidth={2.2} />
                  Delete Roster
                </button>
              )}
            </div>
          </div>

          {/*------------------------------------ Roster Statistics ----------------------------------------------------*/}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Shifts" value={totalShiftCount} />
            <StatCard label="Filled Shifts" value={filledCount} tone="ok" />
            <StatCard label="Unfilled Shifts" value={unfilledCount} tone="urgent" />
            <StatCard label="Volunteers Scheduled" value={scheduledVolunteerCount} tone="brand" />
          </div>

          {/*------------------------------------ Roster Calendar Matrix ----------------------------------------------------*/}

          {isLoading ? (
            <div className="py-16 text-center text-ink-faint font-semibold">Loading week roster…</div>
          ) : !roster ? (
            <div className="py-16 text-center text-ink-faint font-semibold">
              No roster has been generated for {weekLabel} yet.
            </div>
          ) : (
            <RosterMatrix
              volunteers={volunteers}
              assignments={assignments}
              mondayDate={currentWeekStart}
              onSwap={(a) => setAssignModal({ mode: "swap", target: a })}
              onRemove={(a) => setRemoveTarget(a)}
            />
          )}
        </div>
      )}

      {/*------------------------------------ Generate Roster Wizard ----------------------------------------------------*/}

      {activeTab === "generate" && (
        <div className={`${card} p-6 space-y-6`}>
          {/*------------------------------------ Generate Wizard Header ----------------------------------------------------*/}

          <div className="flex items-center justify-between border-b border-line-soft pb-4 flex-wrap gap-4">
            <div>
              <h2 className={cardTitle}>Generate Roster</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-semibold text-ink-faint">Week of:</span>
                <div className="flex items-center bg-surface-sunken border border-line rounded-full overflow-hidden p-0.5">
                  <button
                    onClick={handlePrevWeek}
                    aria-label="Previous week"
                    className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-ink-strong rounded-full"
                  >
                    <LineIcon d={ICONS.chevronLeft} size={14} strokeWidth={2.8} />
                  </button>
                  <span className="font-black text-ink-strong px-2 text-sm">{weekLabel}</span>
                  <button
                    onClick={handleNextWeek}
                    aria-label="Next week"
                    className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-ink-strong rounded-full"
                  >
                    <LineIcon d={ICONS.chevronRightSm} size={14} strokeWidth={2.8} />
                  </button>
                </div>
              </div>
            </div>

            {/* Step indicator: current step is navy, completed step is green */}
            <div className="flex items-center gap-2 font-extrabold">
              <span className={`px-3.5 py-1.5 rounded-full ${step === 1 ? "bg-brand text-brand-ink" : "bg-ok text-ok-ink"}`}>
                1. Review Inputs
              </span>
              <LineIcon d={ICONS.arrowRight} size={16} strokeWidth={2.6} className="text-ink-faint" />
              <span className={`px-3.5 py-1.5 rounded-full ${step === 2 ? "bg-brand text-brand-ink" : "bg-surface-sunken text-ink-faint"}`}>
                2. Generate &amp; Review
              </span>
            </div>
          </div>

          {/*------------------------------------ Step 1: Review Inputs ----------------------------------------------------*/}

          {step === 1 && !isGenerating && (
            <div className="space-y-6">
              <div className="font-semibold text-brand bg-tint px-4 py-3 rounded-2xl">
                Generating roster for <span className="font-black">{weekLabel}</span> based on availability and skill rules.
              </div>

              {/*------------------------------------ Input Statistics ----------------------------------------------------*/}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Volunteers Available" value={selectedVolunteers.length} />
                <StatCard label="Shifts Scheduled" value={shifts.length} />
                <StatCard label="Selected Target Week" value={weekLabel} isText />
              </div>

              {/*------------------------------------ Volunteer Pool ----------------------------------------------------*/}

              <div className="border border-line rounded-3xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === "volunteers" ? null : "volunteers")}
                  className="w-full bg-surface-sunken px-5 py-4 flex items-center justify-between font-black text-ink-strong hover:bg-tint transition-colors"
                >
                  <span>Volunteers Pool ({selectedVolunteers.length})</span>
                  <LineIcon
                    d={ICONS.chevronDown}
                    size={18}
                    strokeWidth={2.6}
                    className={`transition-transform ${expandedSection === "volunteers" ? "rotate-180" : ""}`}
                  />
                </button>

                {expandedSection === "volunteers" && (
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-surface">
                    {selectedVolunteers.map((v) => {
                      // The pool items only carry firstName / lastName / email,
                      // so the display name is built here.
                      const name = `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || v.email || "Volunteer";
                      return (
                        <div
                          key={v.userId}
                          className="flex items-center justify-between bg-surface-sunken border border-line rounded-2xl p-3 hover:border-line-strong transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <PenguinFace size={32} />
                            <div className="min-w-0">
                              <p className="font-black text-ink-strong truncate">{name}</p>
                              <p className="text-sm text-ink-faint truncate">{v.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveVolunteer(v.userId)}
                            className="w-8 h-8 shrink-0 rounded-full bg-urgent text-[#B42318] hover:bg-[#B42318] hover:text-white flex items-center justify-center transition-colors"
                            title="Remove from this generation run"
                            aria-label={`Remove ${name} from this generation run`}
                          >
                            <LineIcon d={ICONS.close} size={16} strokeWidth={2.6} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/*------------------------------------ Scheduled Shifts ----------------------------------------------------*/}

              <div className="border border-line rounded-3xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === "shifts" ? null : "shifts")}
                  className="w-full bg-surface-sunken px-5 py-4 flex items-center justify-between font-black text-ink-strong hover:bg-tint transition-colors"
                >
                  <span>Shifts Scheduled ({shifts.length})</span>
                  <LineIcon
                    d={ICONS.chevronDown}
                    size={18}
                    strokeWidth={2.6}
                    className={`transition-transform ${expandedSection === "shifts" ? "rotate-180" : ""}`}
                  />
                </button>

                {expandedSection === "shifts" && (
                  <div className="p-5 bg-surface space-y-2">
                    {shifts.length === 0 ? (
                      <p className="font-semibold text-ink-faint text-center py-4">
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
                  className={buttonPrimary}
                >
                  <LineIcon d={ICONS.bolt} size={18} strokeWidth={2.2} />
                  Generate Roster for {weekLabel}
                </button>
              </div>
            </div>
          )}

          {/*------------------------------------ Generation Progress ----------------------------------------------------*/}

          {isGenerating && (
            <div className="py-20 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="font-black text-ink-strong text-lg">Generating roster for {weekLabel}...</h3>
              <p className="font-semibold text-ink-muted">Optimising shift assignments...</p>
              <div className="w-64 h-2.5 bg-surface-sunken rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="font-extrabold text-ink-faint">{generationProgress}%</p>
            </div>
          )}

          {/*------------------------------------ Step 2: Generate & Review ----------------------------------------------------*/}

          {step === 2 && !isGenerating && (
            <div className="space-y-6">
              <div className="font-bold text-ok-ink bg-ok px-4 py-3 rounded-2xl flex items-center gap-2 flex-wrap">
                <LineIcon d={ICONS.check} size={18} strokeWidth={2.8} />
                Roster Generated for {weekLabel} — Review assignments before publishing.
              </div>

              {/* 3 Grid Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Shifts Filled" value={filledCount} tone="ok" />
                <StatCard label="Shifts Remaining" value={unfilledCount} tone="urgent" />
                <StatCard label="Volunteers Assigned" value={scheduledVolunteerCount} tone="brand" />
              </div>

              {/* Roster Matrix */}
              {/* Full volunteers list (has name/initials already computed), not
                  the generation-pool selection the matrix filters down to
                  whoever actually has an assignment. */}
              <RosterMatrix volunteers={volunteers} assignments={assignments} mondayDate={currentWeekStart} />

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-line-soft flex-wrap gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-full font-extrabold text-ink-muted hover:bg-surface-sunken transition-colors inline-flex items-center gap-1.5"
                >
                  <LineIcon d={ICONS.chevronLeft} size={16} strokeWidth={2.8} />
                  Back to Review Inputs
                </button>
                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  disabled={isPublished}
                  title={isPublished ? "This roster has already been published" : undefined}
                  className={`${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
               >
                 <LineIcon d={ICONS.check} size={18} strokeWidth={2.6} />
                 {isPublished ? "Already Published" : "Publish Roster"}
              </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/*------------------------------------ Generate Confirm Modal (Weekly Roster tab only) ----------------------------------------------------*/}

      {isGenerateConfirmOpen && (
        <div
          className="fixed inset-0 bg-[#0E2A3D]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsGenerateConfirmOpen(false)}
        >
          <div
            className="bg-surface border border-line rounded-3xl shadow-xl p-6 w-full max-w-md space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-ink-strong">Generate roster for {weekLabel}?</h2>
              <button
                onClick={() => setIsGenerateConfirmOpen(false)}
                className="text-ink-faint hover:text-ink-strong"
                aria-label="Close"
              >
                <LineIcon d={ICONS.close} size={22} strokeWidth={2.4} />
              </button>
            </div>
            <p className="font-semibold text-ink-muted">
              {roster
                ? "A roster already exists for this week. You'll be taken to Review Inputs to check the volunteer pool and shifts before generating again."
                : "You'll be taken to Review Inputs to check the volunteer pool and shifts before anything is generated."}
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line-soft">
              <button
                onClick={() => setIsGenerateConfirmOpen(false)}
                className={buttonOutline}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsGenerateConfirmOpen(false);
                  setStep(1);
                  setActiveTab("generate");
                }}
                className={buttonPrimary}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/*------------------------------------ Publish Modal ----------------------------------------------------*/}

      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-[#0E2A3D]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsPublishModalOpen(false)}>
          <div className="bg-surface border border-line rounded-3xl shadow-xl p-6 w-full max-w-md space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-ink-strong">Publish roster for {weekLabel}?</h2>
              <button onClick={() => setIsPublishModalOpen(false)} className="text-ink-faint hover:text-ink-strong" aria-label="Close">
                <LineIcon d={ICONS.close} size={22} strokeWidth={2.4} />
              </button>
            </div>
            <p className="font-semibold text-ink-muted">
              Once published, volunteers will be notified on the mobile app.{" "}
              <span className="font-black text-ink-strong">This can&apos;t be undone.</span>
            </p>

            {unfilledCount > 0 && (
              <div className="font-bold text-warn-ink bg-warn border border-warn-line px-4 py-3 rounded-2xl">
                {unfilledCount} of {totalShiftCount} shifts are not fully staffed.
              </div>
            )}

            {publishError && (
              <div className="font-bold text-urgent-ink bg-urgent px-4 py-3 rounded-2xl">
                {publishError}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-sunken p-3 rounded-2xl text-center">
                <p className="text-sm font-semibold text-ink-faint">Total Shifts</p>
                <p className="text-xl font-black text-ink-strong">{totalShiftCount}</p>
              </div>
              <div className="bg-ok p-3 rounded-2xl text-center">
                <p className="text-sm font-semibold text-ok-ink">Filled</p>
                <p className="text-xl font-black text-ok-ink">{filledCount}</p>
              </div>
              <div className="bg-urgent p-3 rounded-2xl text-center">
                <p className="text-sm font-semibold text-urgent-ink">Unfilled</p>
                <p className="text-xl font-black text-urgent-ink">{unfilledCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line-soft">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className={buttonOutline}
              >
                Cancel
              </button>
              <button
                onClick={handlePublishRoster}
                className={buttonPrimary}
              >
                <LineIcon d={ICONS.check} size={18} strokeWidth={2.6} />
                Publish Roster
              </button>
            </div>
          </div>
        </div>
      )}

{/*------------------------------------ Delete Roster Modal ----------------------------------------------------*/}

      {isDeleteModalOpen && roster && (
        <div className="fixed inset-0 bg-[#0E2A3D]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isDeleting && setIsDeleteModalOpen(false)}>
          <div className="bg-surface border border-line rounded-3xl shadow-xl p-6 w-full max-w-md space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-ink-strong">Delete roster for {weekLabel}?</h2>
              <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="text-ink-faint hover:text-ink-strong" aria-label="Close">
                <LineIcon d={ICONS.close} size={22} strokeWidth={2.4} />
              </button>
            </div>
            <p className="font-semibold text-ink-muted">
                            This will delete the roster and its {assignments.length} volunteer assignment{assignments.length === 1 ? "" : "s"}.
              Shifts and volunteer records are kept.{" "}
              <span className="font-black text-ink-strong">This can&apos;t be undone.</span>
            </p>
            <p className="text-sm text-ink-faint -mt-3">
              Rosters with attendance records or shift-change requests can&apos;t be deleted.
            </p>

            {isPublished && (
              <div className="font-bold text-warn-ink bg-warn border border-warn-line px-4 py-3 rounded-2xl">
                This roster is Published, so volunteers may already be able to see these shifts on the mobile app.
              </div>
            )}

            {deleteError && (
              <div className="font-bold text-urgent-ink bg-urgent px-4 py-3 rounded-2xl">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line-soft">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className={buttonOutline}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoster}
                disabled={isDeleting}
                className="min-h-12 px-5 rounded-full bg-[#B42318] text-white font-extrabold inline-flex items-center justify-center gap-2 hover:bg-[#9A1D14] disabled:opacity-60 transition-colors"
              >
                <LineIcon d={ICONS.trash} size={18} strokeWidth={2.2} />
                {isDeleting ? "Deleting..." : "Delete Roster"}
              </button>
            </div>
          </div>
        </div>
      )}

 {/*------------------------------------ Assign / Swap Volunteer Modal ----------------------------------------------------*/}

      {assignModal && roster && (
        <AssignVolunteerModal
          mode={assignModal.mode}
          rosterId={roster.rosterId}
          swapTarget={assignModal.mode === "swap" ? assignModal.target : undefined}
          volunteers={volunteers}
          assignments={assignments}
          shiftOptions={[...shifts]
            .sort((a, b) =>
              a.shiftDate === b.shiftDate
                ? a.timeSlot.localeCompare(b.timeSlot)
                : a.shiftDate.localeCompare(b.shiftDate)
            )
            .map((s) => {
              const info = shiftAssignedInfo(s, vacancies);
               return {
                shiftId: s.shiftId,
                label: `${s.shiftDate.slice(0, 10)} · ${shiftSessionLabel(s.timeSlot)} · ${s.location} (${info.assigned}/${info.capacity})`,
                shiftDate: s.shiftDate.slice(0, 10),
                timeSlot: s.timeSlot,
                requiredSkillIds: s.requiredSkillIds ?? [],
              };
            })}
          onClose={() => setAssignModal(null)}
          onDone={reloadRoster}
        />
      )}

      {/*------------------------------------ Remove Assignment Modal ----------------------------------------------------*/}

      {removeTarget && roster && (
        <RemoveAssignmentModal
          rosterId={roster.rosterId}
          assignment={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onDone={reloadRoster}
        />
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
// Small coloured pill summarising this week's roster status: Published (green), a
// generated-but-unpublished draft (amber), or no roster yet (grey).
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function RosterStatusBadge({ roster }: { roster: Roster | null }) {
  const tone = roster ? (roster.status === "Published" ? "ok" : "warn") : "none";
  const label = roster ? roster.status ?? "Needs Review" : "No Roster Generated";
  const classes =
    tone === "ok"
      ? "bg-ok text-ok-ink"
      : tone === "warn"
        ? "bg-warn text-warn-ink border border-warn-line"
        : "bg-surface-sunken text-ink-muted border border-line";
  return <span className={`font-black px-3.5 py-1.5 rounded-full ${classes}`}>{label}</span>;
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
    <div className="flex items-center gap-4 bg-surface-sunken border border-line rounded-2xl p-4">
      {/* Date tile */}
      <div className="w-14 h-14 rounded-2xl bg-brand text-brand-ink flex flex-col items-center justify-center shrink-0">
        <span className="text-lg font-black leading-none">{dayNum}</span>
        <span className="text-[10px] font-extrabold leading-none mt-1">{dayName}</span>
      </div>

      {/* Session, time slot and location */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-ink-strong">
          {shiftSessionLabel(shift.timeSlot)}{" "}
          <span className="font-semibold text-ink-faint">· {shift.timeSlot}</span>
        </p>
        <p className="font-semibold text-ink-muted flex items-center gap-1.5 mt-0.5">
          <LineIcon d={ICONS.location} size={16} strokeWidth={2.2} />
          {shift.location}
        </p>
      </div>

      {/* Assigned / capacity badge: green when full, amber when places remain */}
      <div
        className={`text-right shrink-0 px-3.5 py-2 rounded-2xl border ${
          isFull
            ? "bg-ok border-transparent"
            : "bg-warn border-warn-line"
        }`}
      >
        <p className={`font-black ${isFull ? "text-ok-ink" : "text-warn-ink"}`}>
          {assignedInfo.assigned}/{assignedInfo.capacity}
        </p>
        <p className={`text-[11px] font-semibold ${isFull ? "text-ok-ink" : "text-warn-ink"}`}>volunteers</p>
      </div>
    </div>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Renders a compact statistic card used throughout the roster management interface.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function StatCard({
  label,
  value,
  tone = "default",
  isText = false,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "ok" | "urgent" | "brand";
  isText?: boolean;
}) {
  const valueColor =
    tone === "ok" ? "text-ok-ink" : tone === "urgent" ? "text-urgent-ink" : tone === "brand" ? "text-brand" : "text-ink-strong";
  return (
    <div className={`${card} p-4`}>
      <p className="text-sm font-semibold text-ink-faint mb-1">{label}</p>
      <p className={`font-black ${isText ? "text-base text-ink-strong" : `text-2xl ${valueColor}`}`}>{value}</p>
    </div>
  );
}

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Renders the weekly volunteer assignment matrix for Monday through Sunday.
// When onSwap / onRemove are supplied (Weekly Roster tab only), each
// assignment card shows Swap and Remove actions.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function RosterMatrix({
  volunteers,
  assignments,
  mondayDate,
  onSwap,
  onRemove,
}: {
  volunteers: Volunteer[];
  assignments: RosterAssignment[];
  mondayDate: Date;
  onSwap?: (a: RosterAssignment) => void;
  onRemove?: (a: RosterAssignment) => void;
}) {
  // Generate Mon-Sun labels + ISO date keys based on selected mondayDate.
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

  // Finds every assignment for one volunteer on one day. Returns an array
  // (not just the first match) so a volunteer with both a Morning and an
  // Afternoon shift on the same day shows both and can have either removed.
  function findAssignments(volunteerId: Volunteer["id"], iso: string): RosterAssignment[] {
    return assignments.filter((a) => String(a.userId) === String(volunteerId) && a.shiftDate === iso);
  }

  return (
    <div className="overflow-x-auto border border-line rounded-3xl">
      <table className="w-full text-left">
        {/* Header row: volunteer column plus Monday to Sunday */}
        <thead className="bg-surface-sunken text-ink-faint font-black uppercase tracking-wider text-xs border-b border-line">
          <tr>
            <th className="py-3.5 px-4">Volunteer</th>
            {days.map((d) => (
              <th key={d.iso} className="py-3.5 px-4">{d.dayName} {d.dayNum}</th>
            ))}
          </tr>
        </thead>
        {/* One row per rostered volunteer */}
        <tbody className="divide-y divide-line-soft">
          {rosteredVolunteers.length === 0 ? (
            <tr>
              <td colSpan={days.length + 1} className="py-8 px-4 text-center text-ink-faint font-semibold">
                No volunteers assigned this week.
              </td>
            </tr>
          ) : (
            rosteredVolunteers.map((v) => (
              <tr key={v.id} className="hover:bg-tint/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <PenguinFace size={30} />
                    <span className="font-extrabold text-ink-strong">{v.name}</span>
                  </div>
                </td>
                {/* Day cells: one card per assignment (with Swap / Remove when enabled), or a dash if none */}
                {days.map((d) => {
                  const cell = findAssignments(v.id, d.iso);
                  return (
                    <td key={d.iso} className="py-3.5 px-4 align-top">
                      {cell.length > 0 ? (
                        <div className="space-y-1.5">
                          {cell.map((a) => (
                            <div
                              key={a.rosterAssignmentId}
                              className="bg-ok text-ok-ink p-2.5 rounded-2xl text-xs font-extrabold space-y-0.5"
                            >
                              <p className="text-[11px] font-semibold opacity-80">{a.timeSlot}</p>
                              <p>{a.location ?? "—"}</p>
                              {a.status && <p className="text-[10px] font-semibold opacity-80">{a.status}</p>}
                              {(onSwap || onRemove) && (
                                <div className="flex gap-3 pt-1">
                                  {onSwap && (
                                    <button
                                      onClick={() => onSwap(a)}
                                      aria-label={`Swap ${a.firstName ?? "this volunteer"}`}
                                      className="inline-flex items-center gap-1 text-[11px] font-extrabold hover:underline"
                                    >
                                      <LineIcon d={ICONS.swap} size={13} strokeWidth={2.6} />
                                      Swap
                                    </button>
                                  )}
                                  {onRemove && (
                                    <button
                                      onClick={() => onRemove(a)}
                                      aria-label={`Remove ${a.firstName ?? "this volunteer"}`}
                                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#B42318] hover:underline"
                                    >
                                      <LineIcon d={ICONS.trash} size={13} strokeWidth={2.6} />
                                      Remove
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink-faint font-bold">—</span>
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