"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../app/lib/auth-context";
import {
  VALID_TIME_SLOTS,
  fetchShiftLocations,
  ShiftPayload,
  ShiftLocation,
} from "../../app/lib/api/shifts";
import { ICONS, LineIcon } from "../ui/line-icon";
import { buttonOutline, buttonPrimary, input } from "../ui/styles";

//-----------------------------------------------------------------------------------------------//
//<summary>
// Display labels for each time slot, shown in the Time dropdown.
//</summary>
//-----------------------------------------------------------------------------------------------//

const TIME_SLOT_LABELS: Record<string, string> = {
  "08:00-13:00": "Morning (08:00-13:00)",
  "14:00-17:00": "Afternoon (14:00-17:00)",
  "08:00-17:00": "Full Day (08:00-17:00)",
};

//-----------------------------------------------------------------------------------------------//
//<summary>
// Short session names, only used to suggest a default shift name.
//</summary>
//-----------------------------------------------------------------------------------------------//
const TIME_SLOT_SHORT: Record<string, string> = {
  "08:00-13:00": "Morning",
  "14:00-17:00": "Afternoon",
  "08:00-17:00": "Full Day",
};


//-----------------------------------------------------------------------------------------------//
//<summary>
// The fields the form needs to pre-fill itself when editing.
// Both `Shift` and `Vacancy` satisfy this shape, so either can be passed in
// without conversion or casting.
//</summary>
//-----------------------------------------------------------------------------------------------//
export type ShiftFormInitial = {
  shiftName?: string | null;
  shiftDate?: string;
  timeSlot?: string;
  location?: string | null;
  birdCount?: number | null;
  capacity?: number | null;
};

//-----------------------------------------------------------------------------------------------//
//<summary>
// Shared modal wrapper: a dimmed full-screen backdrop that closes on click,
// with a centred card that stops click propagation. Also used by the shifts
// delete dialog and the roster assign / remove modals.
//</summary>
//-----------------------------------------------------------------------------------------------//
export function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-[#0E2A3D]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/*------------------------------------ Modal Card ----------------------------------------------------*/}
      <div
        className="bg-surface border border-line rounded-3xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

//---------------------------------------------------------------------------------------------------------------//
// Shift Form Modal
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Modal form for creating or editing a shift. Collects the shift name, date,
// time slot and skill / area, then shows either bird count (pen routines) or
// volunteer capacity (supporting areas) depending on the chosen location type.
// Calls onSave with the built ShiftPayload.
//</summary>
//-----------------------------------------------------------------------------------------------//
export function ShiftFormModal({
  mode,
  shift,
  onCancel,
  onSave,
}: {
  mode: "create" | "edit";
  shift?: ShiftFormInitial;
  onCancel: () => void;
  onSave: (payload: ShiftPayload) => Promise<void>;
}) {
  //-----------------------------------------------------------------------------------------------//
  // Auth
  //-----------------------------------------------------------------------------------------------//

  const { token } = useAuth();

  //-----------------------------------------------------------------------------------------------//
  // Form State
  //-----------------------------------------------------------------------------------------------//

  const [shiftDate, setShiftDate] = useState(shift?.shiftDate || "");
  const [timeSlot, setTimeSlot] = useState<string>(
    shift?.timeSlot || VALID_TIME_SLOTS[0]
  );

  const [locations, setLocations] = useState<ShiftLocation[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | "">("");

  // Shift name: until the admin types their own, the field shows a suggested
  // name built from the location and session. An existing name is never
  // overwritten by the suggestion.
  const [shiftName, setShiftName] = useState(shift?.shiftName ?? "");
  const [nameTouched, setNameTouched] = useState(Boolean(shift?.shiftName));

  const [birdCount, setBirdCount] = useState<number>(shift?.birdCount ?? 0);
  const [manualCapacity, setManualCapacity] = useState<number>(
    shift?.capacity && shift.capacity > 0 ? shift.capacity : 1
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const initialLocation = shift?.location ?? "";

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Fetch only shift locations metadata from GET /api/Shifts/locations.
  // When editing, pre-selects the skill whose location name matches the
  // shift's existing location.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  useEffect(() => {
    let isMounted = true;

    const loadLocations = async () => {
      try {
        const locationsData = await fetchShiftLocations(token);

        if (isMounted) {
          setLocations(locationsData);

          // If editing, pre-select the matching skill ID by locationName
          if (initialLocation) {
            const match = locationsData.find(
              (loc) =>
                loc.locationName.toLowerCase() === initialLocation.toLowerCase()
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
  }, [token, initialLocation]);

  //-----------------------------------------------------------------------------------------------//

  // Find currently selected location metadata
  const selectedLocation = locations.find(
    (loc) => loc.skillId === Number(selectedSkillId)
  );

  // Determine Supporting Areas vs Pen Routines logic from locationType
  const locationType = selectedLocation?.locationType || "";
  const isSupportingArea = locationType.toLowerCase().includes("supporting");
  const isPenRoutine =
    locationType.toLowerCase().includes("pen") ||
    (!isSupportingArea && selectedLocation !== undefined);

  // Auto-calculated volunteer capacity (1 volunteer per 25 birds)
  const autoCalculatedCapacity = Math.max(1, Math.ceil(birdCount / 25));

  // Suggested name, e.g. "Pen A – Morning". Empty until a location is chosen.
  const suggestedName = selectedLocation
    ? `${selectedLocation.locationName} – ${TIME_SLOT_SHORT[timeSlot] ?? timeSlot}`
    : "";
  const displayedName = nameTouched ? shiftName : suggestedName;

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Validates the form (date, skill / area and shift name), builds the
  // ShiftPayload and passes it to onSave. Any validation or save error is
  // shown inside the form.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
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

    const trimmedName = displayedName.trim();
    if (!trimmedName) {
      setError("Please enter a shift name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ShiftPayload = {
        shiftName: trimmedName,
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

      {/*------------------------------------ Modal Header ----------------------------------------------------*/}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-ink-strong">
          {mode === "create" ? "New Shift" : "Edit Shift"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-ink-faint hover:text-ink-strong"
          aria-label="Close"
        >
          <LineIcon d={ICONS.close} size={22} strokeWidth={2.4} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/*------------------------------------ Shift Name ----------------------------------------------------*/}
        <div>
          <label
            htmlFor="shift-name"
            className="block font-extrabold text-ink-strong mb-1.5"
          >
            Shift name
          </label>
          <input
            id="shift-name"
            name="shiftName"
            type="text"
            required
            value={displayedName}
            onChange={(e) => {
              setShiftName(e.target.value);
              setNameTouched(true);
            }}
            placeholder="e.g. Pen A – Morning"
            className={input}
          />
          {!nameTouched && suggestedName && (
            <p className="text-sm font-semibold text-ink-faint mt-1.5">
              Suggested from the area and time. Edit it if you want a different
              name.
            </p>
          )}
        </div>

        {/*------------------------------------ Date & Time Slot ----------------------------------------------------*/}
        <div className="grid grid-cols-2 gap-4">
          {/*------------------------------------ Date ----------------------------------------------------*/}
          <div>
            <label
              htmlFor="shift-date"
              className="block font-extrabold text-ink-strong mb-1.5"
            >
              Date
            </label>
            <input
              id="shift-date"
              name="shiftDate"
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className={input}
            />
          </div>

          {/*------------------------------------ Time Slot ----------------------------------------------------*/}
          <div>
            <label
              htmlFor="shift-time"
              className="block font-extrabold text-ink-strong mb-1.5"
            >
              Time
            </label>
            <select
              id="shift-time"
              name="timeSlot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className={input}
            >
              {VALID_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {TIME_SLOT_LABELS[slot] || slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/*------------------------------------ Skills Dropdown (populated via /api/Shifts/locations) ----------------------------------------------------*/}
        <div>
          <label
            htmlFor="shift-skill"
            className="block font-extrabold text-ink-strong mb-1.5"
          >
            Skills
          </label>
          <select
            id="shift-skill"
            name="skill"
            required
            value={selectedSkillId}
            onChange={(e) =>
              setSelectedSkillId(e.target.value ? Number(e.target.value) : "")
            }
            className={`${input} cursor-pointer`}
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

        {/*------------------------------------ Dynamic Display Logic (based on selected location type) ----------------------------------------------------*/}
        {selectedLocation && (
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/*------------------------------------ Pen Routines: Bird Count + Read-only Volunteer Capacity ----------------------------------------------------*/}
            {isPenRoutine && (
              <>
                <div>
                  <label
                    htmlFor="shift-bird-count"
                    className="block font-extrabold text-ink-strong mb-1.5"
                  >
                    Bird Count
                  </label>
                  <input
                    id="shift-bird-count"
                    name="birdCount"
                    type="number"
                    min={0}
                    required
                    value={birdCount}
                    onChange={(e) => setBirdCount(Number(e.target.value))}
                    className={input}
                  />
                </div>
                <div>
                  <p className="block font-extrabold text-ink-strong mb-1.5">
                    Volunteer Capacity (auto-calculated)
                  </p>
                  <div className="w-full min-h-12 px-4 flex items-center rounded-2xl border-2 border-line bg-surface-sunken font-semibold text-ink-muted">
                    {autoCalculatedCapacity} volunteer
                    {autoCalculatedCapacity === 1 ? "" : "s"}
                  </div>
                </div>
              </>
            )}

            {/*------------------------------------ Supporting Areas: Editable Volunteer Capacity ----------------------------------------------------*/}
            {isSupportingArea && (
              <div className="col-span-2">
                <label
                  htmlFor="shift-capacity"
                  className="block font-extrabold text-ink-strong mb-1.5"
                >
                  Volunteer Capacity Needed
                </label>
                <input
                  id="shift-capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  required
                  value={manualCapacity}
                  onChange={(e) => setManualCapacity(Number(e.target.value))}
                  placeholder="Number of volunteers"
                  className={input}
                />
              </div>
            )}
          </div>
        )}

        {/*------------------------------------ Error Message ----------------------------------------------------*/}
        {error && (
          <p className="font-bold text-urgent-ink bg-urgent rounded-2xl px-4 py-3">
            {error}
          </p>
        )}

        {/*------------------------------------ Form Actions ----------------------------------------------------*/}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className={buttonOutline}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={buttonPrimary}
          >
            <LineIcon d={ICONS.check} size={18} strokeWidth={2.6} />
            {isSubmitting
              ? "Saving..."
              : mode === "create"
              ? "Create Shift"
              : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//