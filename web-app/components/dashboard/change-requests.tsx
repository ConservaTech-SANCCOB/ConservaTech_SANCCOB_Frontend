"use client";

import { useState } from "react";
import Link from "next/link";
import { SLOT_INFO, slotKey, type CentreWeek } from "../../app/lib/centre-week";
import type { ShiftRequest } from "../../app/lib/api/volunteers";
import { PenguinFace } from "../ui/penguin";
import { ICONS, LineIcon } from "../ui/line-icon";
import { buttonOutline, buttonPrimary, card, sectionTitle } from "../ui/styles";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Pending shift change requests with Approve and Decline right on the Dashboard. Each button asks
// once more ("Yes, approve" / "Cancel") so a slip of the mouse can't approve anything. When the
// shift is in this week's roster, it also says how many open spots approving would leave.
//</summary>
//---------------------------------------------------------------------------------------------------------------//

export type Decision = "approve" | "decline";

// What happened after the last Approve or Decline, shown above the list.
export interface DecisionStatus {
  text: string;
  tone: "ok" | "error";
}

// The Volunteers page (Request Change tab) lists the rest.
const MAX_SHOWN = 4;

// "2026-11-04" -> "Wednesday 4 Nov", read as a local date so it never shifts a day.
function shiftDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

export function ChangeRequestsPanel({
  requests,
  loaded,
  error,
  week,
  status,
  onDecide,
}: {
  requests: ShiftRequest[];
  loaded: boolean;
  error: string;
  week: CentreWeek | null;
  status: DecisionStatus | null;
  // Saves the decision and resolves true when it worked
  onDecide: (request: ShiftRequest, decision: Decision) => Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState<{ id: string; decision: Decision } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Close the "Are you sure?" row only when the save worked, so a failed save can be retried.
  const decide = async (request: ShiftRequest, decision: Decision) => {
    setBusyId(request.id);
    try {
      if (await onDecide(request, decision)) setConfirming(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      id="requests"
      aria-labelledby="requests-title"
      className={`${card} flex-[1_1_340px] min-w-0 px-6.5 py-6 flex flex-col scroll-mt-6`}
    >
      <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-2 mb-1.5">
        <h2 id="requests-title" className={sectionTitle}>
          Change requests
        </h2>
        {requests.length > 0 && (
          <span className="text-sm font-black text-morning-ink bg-morning rounded-full px-3.5 py-1.5">
            {requests.length} waiting
          </span>
        )}
      </div>

      {/* Read out by screen readers after Approve or Decline */}
      <p
        aria-live="polite"
        className={
          !status
            ? "sr-only"
            : status.tone === "ok"
              ? "my-2 text-sm font-bold text-ok-ink bg-ok rounded-2xl px-4 py-3"
              : "my-2 text-sm font-bold text-urgent-ink bg-urgent rounded-2xl px-4 py-3"
        }
      >
        {status?.text}
      </p>

      {!loaded && <p className="py-4 text-ink-muted">Loading requests…</p>}
      {loaded && error && (
        <p className="my-3 text-sm font-semibold text-urgent-ink bg-urgent rounded-2xl px-4 py-3">{error}</p>
      )}
      {loaded && !error && requests.length === 0 && (
        <p className="py-4 border-t border-line-soft text-ink-muted">No change requests are waiting.</p>
      )}

      {requests.slice(0, MAX_SHOWN).map((request) => {
        const spot = week?.spots.find((s) => s.people.some((p) => p.assignmentId === request.rosterAssignmentId));
        const slotLabel = SLOT_INFO[slotKey(request.timeSlot)].label;
        const where = [shiftDayLabel(request.shiftDate), slotLabel, spot?.location].filter(Boolean).join(" · ");
        const openAfter = spot ? spot.open + 1 : 0;
        // The decision waiting for "Yes", if this request is the one being confirmed
        const pending = confirming && confirming.id === request.id ? confirming.decision : null;
        const isBusy = busyId === request.id;

        return (
          <div key={request.id} className="flex flex-col gap-1.5 py-4 border-t border-line-soft">
            <div className="flex items-center gap-2.5">
              <PenguinFace size={32} />
              <span className="text-lg font-black">{request.volunteerName}</span>
            </div>
            <span className="text-ink-muted">{where}</span>
            {request.reason && <span className="text-ink-muted">Reason: {request.reason}</span>}
            {spot && (
              <span className="flex items-start gap-2 font-extrabold text-open-ink">
                <LineIcon d={ICONS.warning} size={18} strokeWidth={2.2} className="mt-0.5" />
                If you approve, {spot.location} will have {openAfter} open {openAfter === 1 ? "spot" : "spots"}.
              </span>
            )}

            {pending ? (
              <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                <span className="font-extrabold w-full">
                  {pending === "approve" ? "Approve" : "Decline"} {request.volunteerName}&apos;s request?
                </span>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => decide(request, pending)}
                  className={buttonPrimary}
                >
                  {isBusy ? "Saving…" : pending === "approve" ? "Yes, approve" : "Yes, decline"}
                </button>
                <button type="button" disabled={isBusy} onClick={() => setConfirming(null)} className={buttonOutline}>
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setConfirming({ id: request.id, decision: "approve" })}
                  className={buttonPrimary}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming({ id: request.id, decision: "decline" })}
                  className={buttonOutline}
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        );
      })}

      {requests.length > MAX_SHOWN && (
        <Link href="/volunteers" className="pt-4 border-t border-line-soft font-extrabold text-brand hover:underline">
          See the other {requests.length - MAX_SHOWN} on the Volunteers page
        </Link>
      )}
    </section>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//