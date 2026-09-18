"use client";

import { useState } from "react";
import { useAuth } from "../app/lib/auth-context";
import {
  Vacancy,
  ShiftPayload,
  updateShift,
  VALID_TIME_SLOTS,
} from "../app/lib/api/shifts";

interface VacanciesListProps {
  vacancies: Vacancy[];
  onRefresh: () => void;
}

export default function VacanciesList({ vacancies, onRefresh }: VacanciesListProps) {
  const { token } = useAuth();
  
  // State for Edit Modal
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for Notify Action
  const [notifyingShiftId, setNotifyingShiftId] = useState<number | null>(null);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

  // ---- 1. EDIT SHIFT / VACANCY HANDLER ----
  const handleSaveEdit = async (updatedPayload: ShiftPayload) => {
    if (!editingVacancy) return;
    setIsSubmitting(true);
    try {
      await updateShift(token, editingVacancy.shiftId, updatedPayload);
      setEditingVacancy(null);
      onRefresh(); // Trigger parent reload
    } catch (err) {
      console.error("Failed to update vacancy/shift", err);
      alert(err instanceof Error ? err.message : "Failed to update shift.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- 2. NOTIFY QUALIFYING VOLUNTEERS HANDLER ----
  const handleNotifyVolunteers = async (vacancy: Vacancy) => {
    setNotifyingShiftId(vacancy.shiftId);
    setNotifySuccess(null);

    try {
      // POST to backend notifications route filtered by matching requiredSkillIds
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/api/notifications/broadcast-vacancy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shiftId: vacancy.shiftId,
          requiredSkillIds: vacancy.requiredSkillIds,
          title: "New Shift Vacancy Available!",
          message: `A vacancy opened up for ${vacancy.location} on ${vacancy.shiftDate} (${vacancy.timeSlot}).`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to dispatch vacancy notifications.");
      }

      setNotifySuccess(`Notification dispatched to qualifying volunteers for Shift #${vacancy.shiftId}`);
      setTimeout(() => setNotifySuccess(null), 4000);
    } catch (err) {
      console.error("Notify failed", err);
      alert("Unable to send vacancy notification. Please verify backend notification endpoints.");
    } finally {
      setNotifyingShiftId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Banner */}
      {notifySuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{notifySuccess}</span>
          <button onClick={() => setNotifySuccess(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Vacancy Display Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vacancies.map((vacancy) => (
          <div
            key={vacancy.shiftId}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 hover:border-slate-200 transition-all"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  {vacancy.location}
                </span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  {vacancy.vacanciesAvailable} Open Spot{vacancy.vacanciesAvailable > 1 ? "s" : ""}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-2">
                {vacancy.shiftDate}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{vacancy.timeSlot}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 flex justify-between text-xs text-slate-600">
              <div>
                <p className="text-slate-400 text-[10px]">Assigned</p>
                <p className="font-bold text-slate-800">{vacancy.assignedVolunteers} / {vacancy.capacity}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Bird Count</p>
                <p className="font-bold text-slate-800">{vacancy.birdCount}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              {/* EDIT BUTTON */}
              <button
                onClick={() => setEditingVacancy(vacancy)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              >
                <EditIcon />
                Edit Shift
              </button>

              {/* NOTIFY QUALIFYING VOLUNTEERS BUTTON */}
              <button
                onClick={() => handleNotifyVolunteers(vacancy)}
                disabled={notifyingShiftId === vacancy.shiftId}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                title="Post to qualified volunteers matching required skill levels"
              >
                <BellIcon />
                {notifyingShiftId === vacancy.shiftId ? "Sending..." : "Notify Qualified"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT VACANCY MODAL */}
      {editingVacancy && (
        <EditVacancyModal
          vacancy={editingVacancy}
          isSubmitting={isSubmitting}
          onClose={() => setEditingVacancy(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

/* ============================================================
   EDIT VACANCY MODAL COMPONENT
   ============================================================ */

function EditVacancyModal({
  vacancy,
  isSubmitting,
  onClose,
  onSave,
}: {
  vacancy: Vacancy;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (payload: ShiftPayload) => void;
}) {
  const [shiftDate, setShiftDate] = useState(vacancy.shiftDate);
  const [timeSlot, setTimeSlot] = useState(vacancy.timeSlot);
  const [location, setLocation] = useState(vacancy.location);
  const [birdCount, setBirdCount] = useState(vacancy.birdCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      shiftDate,
      timeSlot,
      location,
      birdCount: Number(birdCount),
      requiredSkillIds: vacancy.requiredSkillIds || [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Edit Vacancy / Shift</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Date</label>
            <input
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              {VALID_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bird Count</label>
            <input
              type="number"
              min="1"
              required
              value={birdCount}
              onChange={(e) => setBirdCount(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   ICONS
   ============================================================ */

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}