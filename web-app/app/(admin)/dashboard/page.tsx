"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { getFirstName } from "../../lib/user-display";
import { ApiError, isUnauthorized } from "../../lib/api/http";
import {
  ConservationStats,
  fetchActiveTraining,
  fetchConservationImpact,
  TrainingVolunteerSummary,
  updateConservationImpact,
} from "../../lib/api/dashboard";
import { fetchWeeklyRoster } from "../../lib/api/roster";
import {
  approveShiftRequest,
  declineShiftRequest,
  fetchShiftRequests,
  type ShiftRequest,
} from "../../lib/api/volunteers";
import { addDays, getMonday, toISODate, weekRangeLabel } from "../../lib/centre-week";
import { useCentreWeek } from "../../lib/use-centre-week";
import { useSection } from "../../lib/use-section";
import { DashboardHero } from "@/components/dashboard/hero";
import { AttentionCard } from "@/components/dashboard/attention-card";
import { TodayAtCentre } from "@/components/dashboard/today-at-centre";
import { ChangeRequestsPanel, type Decision, type DecisionStatus } from "@/components/dashboard/change-requests";
import { WeekTiles } from "@/components/dashboard/week-tiles";
import { ImpactCard, RoomScreenCard, TrainingCard } from "@/components/dashboard/side-cards";
import { ICONS } from "@/components/ui/line-icon";
import { buttonOutline, buttonPrimary, input } from "@/components/ui/styles";

//-----------------------------------------------------------------------------------------------//

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

// For the welcome sentence: "Two things need you today."
const COUNT_WORDS = ["Nothing", "One thing", "Two things", "Three things"];

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Dashboard: a welcome banner, three "Needs your attention" cards, today at the centre, change
// requests (approve or decline right here), this week at a glance, and smaller cards for the room
// screen, conservation impact and training. Each part loads on its own, so one failing endpoint
// only shows an error in that part.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export default function DashboardPage() {
  const { token, logout, user } = useAuth();

  // This week's shifts and roster, shared by the banner, today, change requests and the week tiles.
  const { week, error: weekError, loaded: weekLoaded, reload: reloadWeek } = useCentreWeek(token, logout);

  // Next week's roster status. null means it hasn't been made yet (the backend answers 404).
  const nextMonday = useMemo(() => addDays(getMonday(), 7), []);
  const loadNextRoster = useMemo(
    () =>
      token
        ? () =>
            fetchWeeklyRoster(token, toISODate(nextMonday))
              .then((roster) => roster.status ?? "Draft")
              .catch((err: unknown) => {
                if (err instanceof ApiError && err.status === 404) return null;
                throw err;
              })
        : null,
    [token, nextMonday]
  );
  const [nextRoster] = useSection<string | null>(loadNextRoster, logout);

  const loadRequests = useMemo(() => (token ? () => fetchShiftRequests(token) : null), [token]);
  const [requests, setRequests] = useSection<ShiftRequest[]>(loadRequests, logout);
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus | null>(null);

  const [year, setYear] = useState(CURRENT_YEAR);
  const loadConservation = useMemo(() => (token ? () => fetchConservationImpact(token, year) : null), [token, year]);
  const [conservation, setConservation] = useSection<ConservationStats>(loadConservation, logout);

  const loadTraining = useMemo(() => (token ? () => fetchActiveTraining(token) : null), [token]);
  const [training] = useSection<TrainingVolunteerSummary[]>(loadTraining, logout);

  //------------------------------------------------------------------------------------------------------//
  //<summary>
  // Approves or declines a change request, then takes it off the list. Approving frees a spot,
  // so this week's numbers reload too. Resolves true when the save worked.
  //</summary>
  //------------------------------------------------------------------------------------------------------//
  const decideRequest = useCallback(
    async (request: ShiftRequest, decision: Decision): Promise<boolean> => {
      try {
        if (decision === "approve") await approveShiftRequest(token, request.id);
        else await declineShiftRequest(token, request.id);

        setRequests((prev) => ({ ...prev, data: (prev.data ?? []).filter((r) => r.id !== request.id) }));
        setDecisionStatus({
          text: `${request.volunteerName}'s request was ${decision === "approve" ? "approved" : "declined"}.`,
          tone: "ok",
        });
        if (decision === "approve") reloadWeek();
        return true;
      } catch (err) {
        if (isUnauthorized(err)) {
          logout();
          return false;
        }
        setDecisionStatus({
          text: err instanceof Error ? err.message : "That couldn't be saved. Please try again.",
          tone: "error",
        });
        return false;
      }
    },
    [token, logout, reloadWeek, setRequests]
  );

  //------------------------------------------------------------------------------------------------------//
  // "Update the numbers" dialog for conservation impact (same checks and endpoint as before)
  //------------------------------------------------------------------------------------------------------//
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescuedInput, setRescuedInput] = useState("");
  const [releasedInput, setReleasedInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const openModal = () => {
    setRescuedInput(conservation.data ? conservation.data.totalRescued.toString() : "");
    setReleasedInput(conservation.data ? conservation.data.totalReleased.toString() : "");
    setModalError("");
    setIsModalOpen(true);
  };

  // Escape closes the dialog, unless it's busy saving.
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) setIsModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isModalOpen, isSaving]);

  const handleSaveConservationData = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    const rescued = parseInt(rescuedInput, 10);
    const released = parseInt(releasedInput, 10);

    if (isNaN(rescued) || isNaN(released)) {
      setModalError("Please enter valid numeric values.");
      return;
    }

    if (released > rescued) {
      setModalError("Released birds cannot exceed total rescued birds.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateConservationImpact(token, year, {
        totalRescued: rescued,
        totalReleased: released,
      });
      // Use the backend's saved figures; fall back to what was sent if it returns no body.
      setConservation({
        data: updated ?? {
          year,
          totalRescued: rescued,
          totalReleased: released,
          percentReleased: rescued > 0 ? (released / rescued) * 100 : 0,
        },
        error: "",
        loaded: true,
      });
      setIsModalOpen(false);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setModalError(err instanceof Error ? err.message : "Couldn't save conservation data.");
    } finally {
      setIsSaving(false);
    }
  };

  //------------------------------------------------------------------------------------------------------//
  // What needs Cathy: requests waiting, open spots this week, and next week's roster if it isn't out
  //------------------------------------------------------------------------------------------------------//
  const requestCount = requests.data?.length ?? 0;
  const openSpots = week?.openSpots ?? 0;
  const nextStatus = nextRoster.data;
  const nextIsPublished = nextStatus?.toLowerCase() === "published";
  const needsYou =
    (requestCount > 0 ? 1 : 0) +
    (openSpots > 0 ? 1 : 0) +
    (nextRoster.loaded && !nextRoster.error && !nextIsPublished ? 1 : 0);

  let summary = "Loading this week…";
  if (weekLoaded && weekError) {
    summary = "This week's shifts couldn't be loaded.";
  } else if (weekLoaded && week) {
    summary =
      week.totalSpots === 0
        ? "No shifts are set up for this week yet."
        : `This week, ${week.filledSpots} of ${week.totalSpots} spots are filled.`;
    if (week.totalSpots > 0 && week.rosterStatus?.toLowerCase() !== "published") {
      summary += week.rosterStatus ? " This week's roster is still a draft." : " This week has no roster yet.";
    }
    summary += ` ${COUNT_WORDS[needsYou]} ${
      needsYou === 0 ? "needs you right now." : needsYou === 1 ? "needs you today." : "need you today."
    }`;
  }

  const neediest = week?.neediestDay;
  let openText = weekError ? "This week's shifts couldn't be loaded." : "Checking this week…";
  if (week) {
    if (week.totalSpots === 0) openText = "No shifts are set up for this week yet.";
    else if (neediest)
      openText = `${neediest.dayName} needs the most help, with ${neediest.open} ${plural(neediest.open, "spot", "spots")} open.`;
    else openText = "Every spot this week is filled.";
  }
  const noShifts = week?.totalSpots === 0;

  const nextRange = weekRangeLabel(nextMonday);
  let next = { value: "…", text: "Checking next week…", action: "Open the roster" };
  if (nextRoster.loaded && nextRoster.error) {
    next = { value: "?", text: "Next week's roster couldn't be checked.", action: "Open the roster" };
  } else if (nextRoster.loaded && nextStatus === null) {
    next = { value: "Not made", text: `${nextRange} has no roster yet.`, action: "Make the roster" };
  } else if (nextRoster.loaded && nextIsPublished) {
    next = { value: "Published", text: `${nextRange} is out to volunteers.`, action: "Open the roster" };
  } else if (nextRoster.loaded) {
    next = { value: "Draft", text: `${nextRange} is ready for you to check.`, action: "Check and publish" };
  }

  return (
    <div className="flex flex-col gap-7">
      <DashboardHero greeting={greetingFor(new Date().getHours())} name={getFirstName(user)} summary={summary} />

      {/*------------------------------------ Needs your attention ----------------------------------------------------*/}
      <section aria-labelledby="attention-title" className="flex flex-col gap-3.5">
        <h2 id="attention-title" className="text-sm font-black tracking-[0.16em] uppercase text-ink-strong">
          Needs your attention
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4.5">
          <AttentionCard
            tone="morning"
            icon={ICONS.swap}
            value={requests.loaded ? requestCount : "…"}
            label={plural(requestCount, "change request", "change requests")}
            text={
              requests.error
                ? "Change requests couldn't be loaded."
                : requestCount > 0
                  ? "Volunteers asking to swap or drop a shift."
                  : "No one has asked to change a shift."
            }
            href="#requests"
            action="Review requests"
          />
          <AttentionCard
            tone="afternoon"
            icon={ICONS.personPlus}
            value={week ? openSpots : "…"}
            label={plural(openSpots, "open spot this week", "open spots this week")}
            text={openText}
            href={noShifts ? "/shifts" : "/vacancies"}
            action={noShifts ? "Set up shifts" : "Fill open spots"}
          />
          <AttentionCard
            tone="sand"
            icon={ICONS.calendarCheck}
            value={next.value}
            label="next week's roster"
            text={next.text}
            href="/roster"
            action={next.action}
          />
        </div>
      </section>

      {/*------------------------------------ Today + change requests ----------------------------------------------------*/}
      <div className="flex flex-wrap gap-6 items-start">
        <TodayAtCentre week={week} loaded={weekLoaded} error={weekError} />
        <ChangeRequestsPanel
          requests={requests.data ?? []}
          loaded={requests.loaded}
          error={requests.error}
          week={week}
          status={decisionStatus}
          onDecide={decideRequest}
        />
      </div>

      <WeekTiles week={week} loaded={weekLoaded} error={weekError} />

      {/*------------------------------------ Room screen, impact, training ----------------------------------------------------*/}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4.5 items-start">
        <RoomScreenCard week={week} />
        <ImpactCard section={conservation} year={year} years={YEARS} onYearChange={setYear} onEdit={openModal} />
        <TrainingCard section={training} />
      </div>

      {/*------------------------------------ Update the numbers dialog ----------------------------------------------------*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0E2A3D]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="impact-dialog-title"
            className="bg-surface rounded-3xl border-[1.5px] border-line shadow-xl max-w-md w-full p-7 flex flex-col gap-5"
          >
            <div>
              <h2 id="impact-dialog-title" className="text-2xl font-black text-ink-strong">
                Update the numbers
              </h2>
              <p className="text-ink-muted mt-1">Enter the total birds rescued and released in {year}.</p>
            </div>

            {modalError && (
              <p className="text-sm font-semibold text-urgent-ink bg-urgent rounded-2xl px-4 py-3">{modalError}</p>
            )}

            <form onSubmit={handleSaveConservationData} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="font-extrabold">Birds rescued</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  autoFocus
                  value={rescuedInput}
                  onChange={(e) => setRescuedInput(e.target.value)}
                  className={input}
                  required
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-extrabold">Birds released</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={releasedInput}
                  onChange={(e) => setReleasedInput(e.target.value)}
                  className={input}
                  required
                />
              </label>

              <div className="flex flex-wrap justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className={buttonOutline}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className={buttonPrimary}>
                  {isSaving ? "Saving…" : "Save the numbers"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//