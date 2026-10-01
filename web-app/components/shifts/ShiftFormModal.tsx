"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../app/lib/auth-context";
import {
  VALID_TIME_SLOTS,
  fetchShiftLocations,
  Shift,
  ShiftPayload,
  ShiftLocation,
} from "../../app/lib/api/shifts";

const TIME_SLOT_LABELS: Record<string, string> = {
  "08:00-13:00": "Morning (08:00-13:00)",
  "14:00-17:00": "Afternoon (14:00-17:00)",
  "08:00-17:00": "Full Day (08:00-17:00)",
};

export function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
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
  const { token } = useAuth();

  const [shiftDate, setShiftDate] = useState(shift?.shiftDate || "");
  const [timeSlot, setTimeSlot] = useState<string>(
    shift?.timeSlot || VALID_TIME_SLOTS[0]
  );

  const [locations, setLocations] = useState<ShiftLocation[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | "">("");

  const [birdCount, setBirdCount] = useState<number>(shift?.birdCount ?? 0);
  const [manualCapacity, setManualCapacity] = useState<number>(
    shift?.capacity && shift.capacity > 0 ? shift.capacity : 1
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch only shift locations metadata from GET /api/Shifts/locations
  useEffect(() => {
    let isMounted = true;

    const loadLocations = async () => {
      try {
        const locationsData = await fetchShiftLocations(token);

        if (isMounted) {
          setLocations(locationsData);

          // If editing an existing shift, pre-select matching skill ID by locationName
          if (shift?.location) {
            const match = locationsData.find(
              (loc) => loc.locationName.toLowerCase() === shift.location?.toLowerCase()
            );
            if (match) {
              setSelectedSkillId(match.skillId);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load locations metadata", err);
      }
    };

    if (token) {
      loadLocations();
    }

    return () => {
      isMounted = false;
    };
  }, [token, shift]);

  // Find currently selected location metadata
  const selectedLocation = locations.find(
    (loc) => loc.skillId === Number(selectedSkillId)
  );

  // Determine Supporting Areas vs Pen Routines logic from locationType
  const locationType = selectedLocation?.locationType || "";
  const isSupportingArea = locationType.toLowerCase().includes("supporting");
  const isPenRoutine =
    locationType.toLowerCase().includes("pen") || (!isSupportingArea && selectedLocation !== undefined);

  // Auto-calculated volunteer capacity (1 volunteer per 25 birds)
  const autoCalculatedCapacity = Math.max(1, Math.ceil(birdCount / 25));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!shiftDate) {
      setError("Please select a valid date.");
      return;
    }

    if (!selectedLocation) {
      setError("Please select a skill / area.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ShiftPayload = {
        shiftDate,
        timeSlot,
        location: selectedLocation.locationName,
        birdCount: isPenRoutine ? birdCount : null,
        capacity: isSupportingArea ? manualCapacity : autoCalculatedCapacity,
        requiredSkillIds: [selectedLocation.skillId],
      };

      await onSave(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save shift.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onCancel}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          {mode === "create" ? "New Shift" : "Edit Shift"}
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date & Time Slot */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Time
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            >
              {VALID_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {TIME_SLOT_LABELS[slot] || slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Skills Dropdown (populated via /api/Shifts/locations) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Skills
          </label>
          <select
            required
            value={selectedSkillId}
            onChange={(e) =>
              setSelectedSkillId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer bg-white"
          >
            <option value="" disabled>
              Select a skill...
            </option>
            {locations.map((loc) => (
              <option key={loc.skillId} value={loc.skillId}>
                {loc.locationName}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Display Logic based on selected location type */}
        {selectedLocation && (
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Pen Routines: Bird Count + Read-only Volunteer Capacity */}
            {isPenRoutine && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bird Count
                  </label>
                  <input
                    type="number"
                    min={0}
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
                    {autoCalculatedCapacity} volunteer
                    {autoCalculatedCapacity === 1 ? "" : "s"}
                  </div>
                </div>
              </>
            )}

            {/* Supporting Areas: Editable Volunteer Capacity */}
            {isSupportingArea && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Volunteer Capacity Needed
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={manualCapacity}
                  onChange={(e) => setManualCapacity(Number(e.target.value))}
                  placeholder="Number of volunteers"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            )}
          </div>
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