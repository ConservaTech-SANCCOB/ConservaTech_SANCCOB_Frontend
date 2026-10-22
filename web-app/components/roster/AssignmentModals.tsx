"use client";

import { useState } from "react";
import { useAuth } from "../../app/lib/auth-context";
import {
  addRosterAssignment,
  removeRosterAssignment,
  RosterAssignment,
} from "../../app/lib/api/roster";
import { Volunteer } from "../../app/lib/api/volunteers";
import { ModalOverlay } from "../shifts/ShiftFormModal";

export type ShiftOption = { shiftId: number; label: string };

//-----------------------------------------------------------------------------------------------//
//<summary>
// Modal for adding a volunteer to a shift ("add") or replacing the volunteer
// on an existing assignment ("swap"). Swap adds the new volunteer FIRST and
// only removes the old assignment once that succeeds, so a failed add can
// never leave a shift short-staffed. Capacity rules are left to the backend.
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

  const effectiveShiftId = mode === "swap" ? swapTarget?.shiftId : shiftId;

  // Volunteers already on this shift can't be picked again.
  const alreadyOnShift = new Set(
    assignments.filter((a) => a.shiftId === effectiveShiftId).map((a) => a.userId)
  );
  const candidates = volunteers.filter((v) => !alreadyOnShift.has(Number(v.id)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (effectiveShiftId === undefined || effectiveShiftId === "") {
      setError("Please select a shift.");
      return;
    }
    if (userId === "") {
      setError("Please select a volunteer.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addRosterAssignment(token, rosterId, {
        shiftId: Number(effectiveShiftId),
        userId: Number(userId),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add volunteer.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "swap" && swapTarget) {
      try {
        await removeRosterAssignment(token, rosterId, swapTarget.rosterAssignmentId);
      } catch (err) {
        // New volunteer is already on the shift; surface it and refresh.
        await onDone();
        setError(
          "The new volunteer was added, but the original assignment could not be removed. " +
            (err instanceof Error ? err.message : "")
        );
        setIsSubmitting(false);
        return;
      }
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
        <h2 className="text-lg font-bold text-slate-900">
          {mode === "add" ? "Assign Volunteer to Shift" : "Swap Volunteer"}
        </h2>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
          ✕
        </button>
      </div>

      {mode === "swap" && swapTarget && (
        <p className="text-xs text-slate-500 mb-4">
          Replacing <span className="font-semibold text-slate-800">{swapName}</span> on{" "}
          {swapTarget.shiftDate.slice(0, 10)} · {swapTarget.timeSlot} · {swapTarget.location}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "add" && (
          <div>
            <label htmlFor="assign-shift" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Shift
            </label>
            <select
              id="assign-shift"
              value={shiftId}
              onChange={(e) => {
                setShiftId(e.target.value ? Number(e.target.value) : "");
                setUserId("");
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              <option value="" disabled>Select a shift...</option>
              {shiftOptions.map((s) => (
                <option key={s.shiftId} value={s.shiftId}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="assign-volunteer" className="block text-xs font-semibold text-slate-700 mb-1.5">
            {mode === "add" ? "Volunteer" : "New volunteer"}
          </label>
          <select
            id="assign-volunteer"
            value={userId}
            onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          >
            <option value="" disabled>Select a volunteer...</option>
            {candidates.map((v) => (
              <option key={v.id} value={Number(v.id)}>{v.name}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
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
      <h2 className="text-lg font-bold text-slate-900 mb-2">Remove from shift?</h2>
      <p className="text-sm text-slate-500 mb-4">
        Remove <span className="font-semibold text-slate-800">{name}</span> from{" "}
        {assignment.shiftDate.slice(0, 10)} · {assignment.timeSlot} · {assignment.location}? The shift will have an open vacancy.
      </p>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
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