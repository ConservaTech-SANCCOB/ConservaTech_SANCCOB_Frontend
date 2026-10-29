"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../app/lib/auth-context";
import {
  addRosterAssignment,
  removeRosterAssignment,
  replaceRosterAssignment,
  RosterAssignment,
} from "../../app/lib/api/roster";
import {
  fetchTrainingVolunteerProfile,
  TrainingVolunteerProfile,
} from "../../app/lib/api/training_staff";
import { Volunteer } from "../../app/lib/api/volunteers";
import { ModalOverlay } from "../shifts/ShiftFormModal";

//-----------------------------------------------------------------------------------------------//
//<summary>
// One selectable shift. shiftDate is "YYYY-MM-DD", timeSlot is "HH:MM-HH:MM"
// and requiredSkillIds are the skills a volunteer must be signed off on.
//</summary>
//-----------------------------------------------------------------------------------------------//
export type ShiftOption = {
  shiftId: number;
  label: string;
  shiftDate: string;
  timeSlot: string;
  requiredSkillIds: number[];
};

//-----------------------------------------------------------------------------------------------//
//<summary>
// Parses "HH:MM-HH:MM" into [startMinutes, endMinutes], or null if the
// string isn't in that format.
//</summary>
//-----------------------------------------------------------------------------------------------//
function parseSlot(slot: string | null | undefined): [number, number] | null {
  const m = slot?.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return [Number(m[1]) * 60 + Number(m[2]), Number(m[3]) * 60 + Number(m[4])];
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// True when two time slots overlap (e.g. Full Day overlaps Morning). Slots
// that can't be parsed only count as overlapping when they're identical.
//</summary>
//-----------------------------------------------------------------------------------------------//
function slotsOverlap(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const pa = parseSlot(a);
  const pb = parseSlot(b);
  if (!pa || !pb) return false;
  return pa[0] < pb[1] && pb[0] < pa[1];
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Collects the skillIds a volunteer has been signed off on, across all
// three skill groups of their training profile.
//</summary>
//-----------------------------------------------------------------------------------------------//
function signedOffSkillIds(profile: TrainingVolunteerProfile): number[] {
  const all = [
    ...(profile.supportingAreas ?? []),
    ...(profile.penRoutines ?? []),
    ...(profile.seasonalSkills ?? []),
  ];
  return all.filter((s) => s.isSignedOff).map((s) => s.skillId);
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Modal for adding a volunteer to a shift ("add") or replacing the volunteer
// on an existing assignment ("swap"). Swap uses the single /replace endpoint
// so a full shift is never pushed over capacity. The volunteer dropdown only
// lists eligible volunteers: not already on the shift, not clashing with
// another assignment at the same date and time, and signed off on every
// skill the shift requires. The backend remains the final validator.
//</summary>
//-----------------------------------------------------------------------------------------------//
export function AssignVolunteerModal({
  mode,
  rosterId,
  shiftOptions,
  volunteers,
  assignments,
  swapTarget,
  onClose,
  onDone,
}: {
  mode: "add" | "swap";
  rosterId: number;
  shiftOptions: ShiftOption[];
  volunteers: Volunteer[];
  assignments: RosterAssignment[];
  swapTarget?: RosterAssignment;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const { token } = useAuth();
  const [shiftId, setShiftId] = useState<number | "">("");
  const [userId, setUserId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // userId -> signed-off skillIds. null means the lookup failed (unknown).
  const [skillCache, setSkillCache] = useState<Record<number, number[] | null>>({});

  //---------------------------- Target shift ----------------------------//
  const effectiveShiftId = mode === "swap" ? swapTarget?.shiftId : shiftId;
  const selectedOption = shiftOptions.find((s) => s.shiftId === effectiveShiftId);
  const target: ShiftOption | undefined =
    selectedOption ??
    (swapTarget
      ? {
          shiftId: swapTarget.shiftId,
          label: "",
          shiftDate: swapTarget.shiftDate.slice(0, 10),
          timeSlot: swapTarget.timeSlot ?? "",
          requiredSkillIds: [],
        }
      : undefined);

  //---------------------------- Eligibility, step 1: availability ----------------------------//
  // Not already on this shift, and no other assignment that day whose time overlaps.
  const availableVolunteers = target
    ? volunteers.filter((v) => {
        const id = Number(v.id);
        return !assignments.some(
          (a) =>
            a.userId === id &&
            (a.shiftId === target.shiftId ||
              (a.shiftDate.slice(0, 10) === target.shiftDate &&
                slotsOverlap(a.timeSlot, target.timeSlot)))
        );
      })
    : [];

  //---------------------------- Eligibility, step 2: skills ----------------------------//
  const requiredIds = target?.requiredSkillIds ?? [];
  const needsSkillCheck = requiredIds.length > 0;
  const missingIds = needsSkillCheck
    ? availableVolunteers.map((v) => Number(v.id)).filter((id) => !(id in skillCache))
    : [];
  const isCheckingSkills = missingIds.length > 0;
  const missingKey = missingIds.join(",");

  // Fetches the training profile of every volunteer we haven't checked yet.
  // Results are cached so changing shifts doesn't refetch the same people.
  useEffect(() => {
    if (!missingKey) return;
    let cancelled = false;
    const ids = missingKey.split(",").map(Number);

    Promise.all(
      ids.map(async (id) => {
        try {
          const profile = await fetchTrainingVolunteerProfile(id, token);
          return [id, signedOffSkillIds(profile)] as const;
        } catch (err) {
          console.warn(`Could not load training profile for volunteer ${id}`, err);
          return [id, null] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setSkillCache((prev) => {
        const next = { ...prev };
        entries.forEach(([id, skills]) => {
          next[id] = skills;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [missingKey, token]);

  const candidates = needsSkillCheck
    ? availableVolunteers.filter((v) => {
        const skills = skillCache[Number(v.id)];
        if (skills === undefined) return false; // still loading
        if (skills === null) return true; // lookup failed: let the backend decide
        return requiredIds.every((id) => skills.includes(id));
      })
    : availableVolunteers;

  const volunteerPlaceholder = !target
    ? "Select a shift first..."
    : isCheckingSkills
      ? "Checking skills..."
      : candidates.length === 0
        ? "No eligible volunteers"
        : "Select a volunteer...";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!target) {
      setError("Please select a shift.");
      return;
    }
    if (userId === "") {
      setError("Please select a volunteer.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "swap" && swapTarget) {
        const result = await replaceRosterAssignment(
          token,
          rosterId,
          swapTarget.rosterAssignmentId,
          { shiftId: swapTarget.shiftId, userId: Number(userId) }
        );
        console.log("replace response", result); // TEMP: check the returned rosterAssignmentId, then remove
      } else {
        await addRosterAssignment(token, rosterId, {
          shiftId: target.shiftId,
          userId: Number(userId),
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === "swap"
            ? "Unable to swap volunteer."
            : "Unable to add volunteer."
      );
      setIsSubmitting(false);
      return;
    }

    await onDone();
    setIsSubmitting(false);
    onClose();
  };

  const swapName = swapTarget
    ? `${swapTarget.firstName ?? ""} ${swapTarget.lastName ?? ""}`.trim()
    : "";

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {mode === "add" ? "Assign Volunteer to Shift" : "Swap Volunteer"}
        </h2>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Close">
          ✕
        </button>
      </div>

      {mode === "swap" && swapTarget && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Replacing <span className="font-semibold text-slate-800 dark:text-slate-100">{swapName}</span> on{" "}
          {swapTarget.shiftDate.slice(0, 10)} · {swapTarget.timeSlot} · {swapTarget.location}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "add" && (
          <div>
            <label htmlFor="assign-shift" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Shift
            </label>
            <select
              id="assign-shift"
              value={shiftId}
              onChange={(e) => {
                setShiftId(e.target.value ? Number(e.target.value) : "");
                setUserId("");
              }}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              <option value="" disabled>Select a shift...</option>
              {shiftOptions.map((s) => (
                <option key={s.shiftId} value={s.shiftId}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="assign-volunteer" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {mode === "add" ? "Volunteer" : "New volunteer"}
          </label>
          <select
            id="assign-volunteer"
            value={userId}
            onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}
            disabled={!target || isCheckingSkills}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-60"
          >
            <option value="" disabled>{volunteerPlaceholder}</option>
            {candidates.map((v) => (
              <option key={v.id} value={Number(v.id)}>{v.name}</option>
            ))}
          </select>
          {target && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              Only volunteers who are free for this shift
              {needsSkillCheck ? " and signed off on its required skills" : ""} are listed.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCheckingSkills}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : mode === "add" ? "Assign" : "Swap"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Confirmation modal for removing one volunteer assignment from a roster.
//</summary>
//-----------------------------------------------------------------------------------------------//
export function RemoveAssignmentModal({
  rosterId,
  assignment,
  onClose,
  onDone,
}: {
  rosterId: number;
  assignment: RosterAssignment;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const { token } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState("");

  const name = `${assignment.firstName ?? ""} ${assignment.lastName ?? ""}`.trim() || "this volunteer";

  const handleRemove = async () => {
    setError("");
    setIsRemoving(true);
    try {
      await removeRosterAssignment(token, rosterId, assignment.rosterAssignmentId);
      await onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove assignment.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Remove from shift?</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Remove <span className="font-semibold text-slate-800 dark:text-slate-100">{name}</span> from{" "}
        {assignment.shiftDate.slice(0, 10)} · {assignment.timeSlot} · {assignment.location}? The shift will have an open vacancy.
      </p>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
          Cancel
        </button>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isRemoving ? "Removing..." : "Remove"}
        </button>
      </div>
    </ModalOverlay>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//