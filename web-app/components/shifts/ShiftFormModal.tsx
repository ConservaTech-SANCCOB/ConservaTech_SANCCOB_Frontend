"use client";

import { useState } from "react";
import {
  calculateCapacity,
  isQuarantineLocation,
  maxBirdsForLocation,
  VALID_TIME_SLOTS,
  Shift,
  ShiftPayload,
} from "../../app/lib/api/shifts";

const TIME_SLOT_LABELS: Record<string, string> = {
  "08:00-13:00": "Morning (08:00-13:00)",
  "14:00-17:00": "Afternoon (14:00-17:00)",
  "08:00-17:00": "Full Day (08:00-17:00)",
};

const LOCATION_SUGGESTIONS = [
  "African Penguin Pen A",
  "African Penguin Pen B",
  "Aviary 1",
  "Cape Cormorant Section",
  "Food Preparation",
  "ICU",
  "NUR",
  "Quarantine Zone",
];

export function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ShiftFormModal({
  mode,
  shift,
  onCancel,
  onSave,
}: {
  mode: "create" | "edit";
  shift?: Shift;
  onCancel: () => void;
  onSave: (payload: ShiftPayload) => Promise<void>;
}) {
  const [shiftDate, setShiftDate] = useState(shift?.shiftDate || "");
  const [timeSlot, setTimeSlot] = useState<string>(shift?.timeSlot || VALID_TIME_SLOTS[0]);
  const [location, setLocation] = useState(shift?.location || "");
  const [birdCount, setBirdCount] = useState(shift?.birdCount ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const maxBirds = maxBirdsForLocation(location);
  const computedCapacity = calculateCapacity(birdCount, location);
  const quarantine = isQuarantineLocation(location);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (birdCount > maxBirds) {
      setError(
        quarantine
          ? "Quarantine shifts are capped at 25 birds to keep capacity at 1 volunteer."
          : "Bird count can't exceed 30."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        shiftDate,
        timeSlot,
        location: location.trim(),
        birdCount,
        requiredSkillIds: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save shift.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onCancel}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-900">{mode === "create" ? "New Shift" : "Edit Shift"}</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
            <input
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              {VALID_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {TIME_SLOT_LABELS[slot]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department / Area</label>
          <input
            type="text"
            required
            list="location-suggestions"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
          <datalist id="location-suggestions">
            {LOCATION_SUGGESTIONS.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bird Count (max {maxBirds})
            </label>
            <input
              type="number"
              min={0}
              max={maxBirds}
              required
              value={birdCount}
              onChange={(e) => setBirdCount(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Volunteer Capacity (auto-calculated)
            </label>
            <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 bg-slate-100">
              {computedCapacity} volunteer{computedCapacity === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {quarantine && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Quarantine shifts are capped at 1 volunteer. Note: the 3-day rolling limit per
            volunteer can't be enforced here yet — it requires assignment history data that
            isn't available from a confirmed endpoint.
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}