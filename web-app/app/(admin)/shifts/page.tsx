"use client";

import { useEffect, useMemo, useState } from "react";
import {ModalOverlay, ShiftFormModal} from "../../../components/shifts/ShiftFormModal";
import { useAuth } from "../../lib/auth-context";
import {
  fetchShifts,
  fetchVacancies,
  createShift,
  updateShift,
  deleteShift,
  calculateCapacity,
  isQuarantineLocation,
  maxBirdsForLocation,
  VALID_TIME_SLOTS,
  Shift,
  Vacancy,
  ShiftPayload,
} from "../../lib/api/shifts";

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

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getMonthGrid(currentMonth: Date): (Date | null)[][] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function ShiftSchedulingPage() {
  const { token } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [capacityMode, setCapacityMode] = useState<"people" | "birds">("people");

  // Ephemeral, local-only notes keyed by shiftId. The confirmed Shift schema has
  // no `notes` field, so nothing here is sent to or persisted by the backend —
  // this resets on page refresh until the backend adds real support for it.
  const [notesByShiftId, setNotesByShiftId] = useState<Record<number, string>>({});

  const [modalState, setModalState] = useState<{ mode: "create" | "edit"; shift?: Shift } | null>(
    null
  );
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  async function loadData() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const [shiftData, vacancyData] = await Promise.all([
        fetchShifts(token),
        fetchVacancies(token),
      ]);
      setShifts(shiftData);
      setVacancies(vacancyData);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to load shift data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  const vacancyMap = useMemo(() => {
    const map = new Map<number, Vacancy>();
    vacancies.forEach((v) => map.set(v.shiftId, v));
    return map;
  }, [vacancies]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    shifts.forEach((shift) => {
      const list = map.get(shift.shiftDate) || [];
      list.push(shift);
      map.set(shift.shiftDate, list);
    });
    return map;
  }, [shifts]);

  const selectedShift = shifts.find((s) => s.shiftId === selectedShiftId) || null;
  const weeks = getMonthGrid(currentMonth);

  function getStatus(shift: Shift): { label: string; color: string; assigned: number } {
    const assigned = vacancyMap.get(shift.shiftId)?.assignedVolunteers ?? 0;
    const capacity = shift.capacity;

    if (capacity === 0 || assigned === capacity) {
      return { label: "Fully Staffed", color: "green", assigned };
    }
    if (assigned > capacity) {
      return { label: "Over Capacity", color: "red", assigned };
    }
    const ratio = assigned / capacity;
    if (ratio < 0.5) {
      return { label: "Critical", color: "red", assigned };
    }
    return { label: "Understaffed", color: "amber", assigned };
  }

  async function handleSaveShift(payload: ShiftPayload) {
    if (modalState?.mode === "edit" && modalState.shift) {
      const updated = await updateShift(token, modalState.shift.shiftId, payload);
      setShifts((prev) => prev.map((s) => (s.shiftId === updated.shiftId ? updated : s)));
    } else {
      const created = await createShift(token, payload);
      setShifts((prev) => [...prev, created]);
    }
    await loadData(); // refresh vacancy counts too
    setModalState(null);
  }

  async function handleConfirmDelete() {
    if (!deletingShift) return;
    try {
      await deleteShift(token, deletingShift.shiftId);
      setShifts((prev) => prev.filter((s) => s.shiftId !== deletingShift.shiftId));
      if (selectedShiftId === deletingShift.shiftId) setSelectedShiftId(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to delete shift.");
    } finally {
      setDeletingShift(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shift Scheduling</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })} 
            {/* — Morning &
            afternoon shift calendar */}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              ‹ Previous
            </button>
            <span className="text-sm font-semibold text-slate-800 w-32 text-center">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              Next ›
            </button>
          </div>
          <button
            onClick={() => setModalState({ mode: "create" })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
          >
            + New Shift
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* CALENDAR */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-bold text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading shifts…</div>
          ) : (
            weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
                {week.map((date, di) => {
                  const dayShifts = date ? shiftsByDate.get(toDateKey(date)) || [] : [];
                  const isToday = date && toDateKey(date) === toDateKey(new Date());
                  return (
                    <div key={di} className="min-h-[110px] border-r border-slate-100 last:border-r-0 p-2">
                      {date && (
                        <>
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                              isToday ? "bg-blue-700 text-white" : "text-slate-500"
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          <div className="mt-1.5 space-y-1">
                            {dayShifts.map((shift) => {
                              const status = getStatus(shift);
                              const colorClasses =
                                status.color === "green"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : status.color === "amber"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700";
                              return (
                                <button
                                  key={shift.shiftId}
                                  onClick={() => setSelectedShiftId(shift.shiftId)}
                                  className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-semibold truncate ${colorClasses} ${
                                    selectedShiftId === shift.shiftId ? "ring-2 ring-blue-500" : ""
                                  }`}
                                  title={`${shift.location} · ${shift.timeSlot}`}
                                >
                                  {status.assigned}/{shift.capacity} · {shift.location.slice(0, 8)}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-4">
          {!selectedShift ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <p className="text-4xl mb-2">📅</p>
              <p className="font-semibold text-slate-800">No shift selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Click a shift badge on the calendar to view details
              </p>
            </div>
          ) : (
            <ShiftDetailPanel
              shift={selectedShift}
              status={getStatus(selectedShift)}
              capacityMode={capacityMode}
              onCapacityModeChange={setCapacityMode}
              notes={notesByShiftId[selectedShift.shiftId] || ""}
              onNotesChange={(text) =>
                setNotesByShiftId((prev) => ({ ...prev, [selectedShift.shiftId]: text }))
              }
              onEdit={() => setModalState({ mode: "edit", shift: selectedShift })}
              onDelete={() => setDeletingShift(selectedShift)}
              onClose={() => setSelectedShiftId(null)}
            />
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Capacity Status
            </h3>
            <div className="space-y-2 text-sm">
              <LegendRow color="bg-emerald-500" label="Fully Staffed" />
              <LegendRow color="bg-amber-500" label="Understaffed" />
              <LegendRow color="bg-red-500" label="Over Capacity / Critical" />
            </div>
          </div>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {modalState && (
        <ShiftFormModal
          mode={modalState.mode}
          shift={modalState.shift}
          onCancel={() => setModalState(null)}
          onSave={handleSaveShift}
        />
      )}

      {/* DELETE CONFIRM */}
      {deletingShift && (
        <ModalOverlay onClose={() => setDeletingShift(null)}>
          <h2 className="text-lg font-bold text-slate-900">Delete Shift</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Are you sure you want to delete the {deletingShift.location} shift on{" "}
            {deletingShift.shiftDate}? This can't be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingShift(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ---- Detail Panel ----

function ShiftDetailPanel({
  shift,
  status,
  capacityMode,
  onCapacityModeChange,
  notes,
  onNotesChange,
  onEdit,
  onDelete,
  onClose,
}: {
  shift: Shift;
  status: { label: string; color: string; assigned: number };
  capacityMode: "people" | "birds";
  onCapacityModeChange: (mode: "people" | "birds") => void;
  notes: string;
  onNotesChange: (text: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const barColor =
    status.color === "green" ? "bg-emerald-500" : status.color === "amber" ? "bg-amber-500" : "bg-red-500";
  const percent = shift.capacity > 0 ? Math.min((status.assigned / shift.capacity) * 100, 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 flex items-start justify-between">
        <div>
          <span className="inline-block text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1.5">
            {TIME_SLOT_LABELS[shift.timeSlot]?.split(" ")[0] || shift.timeSlot}
          </span>
          <h3 className="font-bold text-slate-900">{shift.location}</h3>
          <p className="text-xs text-slate-400">
            {shift.shiftDate} · {shift.timeSlot}
          </p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Capacity Mode</span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
              <button
                onClick={() => onCapacityModeChange("people")}
                className={`px-2.5 py-1 ${capacityMode === "people" ? "bg-blue-700 text-white" : "text-slate-500"}`}
              >
                People
              </button>
              <button
                onClick={() => onCapacityModeChange("birds")}
                className={`px-2.5 py-1 ${capacityMode === "birds" ? "bg-blue-700 text-white" : "text-slate-500"}`}
              >
                Birds
              </button>
            </div>
          </div>

          {capacityMode === "people" ? (
            <p className="text-2xl font-bold text-slate-900">
              {status.assigned} <span className="text-sm font-normal text-slate-400">/ {shift.capacity} Volunteers</span>
            </p>
          ) : (
            <p className="text-2xl font-bold text-slate-900">
              {shift.birdCount} <span className="text-sm font-normal text-slate-400">/ 30 Birds</span>
            </p>
          )}
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
          </div>
          <p
            className={`text-xs font-semibold mt-1 ${
              status.color === "green" ? "text-emerald-600" : status.color === "amber" ? "text-amber-600" : "text-red-600"
            }`}
          >
            {status.label}
          </p>
        </div>
{/* awaiting roster assignment endpoints */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Assigned Volunteers</p>
          <p className="text-xs text-slate-400 italic bg-slate-50 rounded-lg px-3 py-3">
            Volunteer names aren't available yet — the backend currently only returns a count
            ({status.assigned} assigned), not who they are. This section will populate once an
            admin roster-assignment endpoint is confirmed.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add a note (not saved to the server yet)…"
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
          >
            Edit Shift
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-slate-600">{label}</span>
    </div>
  );
}

// ---- Create / Edit Modal ----

// function ShiftFormModal({
//   mode,
//   shift,
//   onCancel,
//   onSave,
// }: {
//   mode: "create" | "edit";
//   shift?: Shift;
//   onCancel: () => void;
//   onSave: (payload: ShiftPayload) => Promise<void>;
// }) {
//   const [shiftDate, setShiftDate] = useState(shift?.shiftDate || "");
//   const [timeSlot, setTimeSlot] = useState<string>(shift?.timeSlot || VALID_TIME_SLOTS[0]);
//   const [location, setLocation] = useState(shift?.location || "");
//   const [birdCount, setBirdCount] = useState(shift?.birdCount ?? 0);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState("");

//   const maxBirds = maxBirdsForLocation(location);
//   const computedCapacity = calculateCapacity(birdCount, location);
//   const quarantine = isQuarantineLocation(location);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     if (birdCount > maxBirds) {
//       setError(
//         quarantine
//           ? "Quarantine shifts are capped at 25 birds to keep capacity at 1 volunteer."
//           : "Bird count can't exceed 30."
//       );
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       await onSave({
//         shiftDate,
//         timeSlot,
//         location: location.trim(),
//         birdCount,
//         requiredSkillIds: [],
//       });
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Unable to save shift.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <ModalOverlay onClose={onCancel}>
//       <div className="flex items-center justify-between mb-5">
//         <h2 className="text-lg font-bold text-slate-900">{mode === "create" ? "New Shift" : "Edit Shift"}</h2>
//         <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
//           ✕
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
//             <input
//               type="date"
//               required
//               value={shiftDate}
//               onChange={(e) => setShiftDate(e.target.value)}
//               className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
//             />
//           </div>
//           <div>
//             <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time</label>
//             <select
//               value={timeSlot}
//               onChange={(e) => setTimeSlot(e.target.value)}
//               className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
//             >
//               {VALID_TIME_SLOTS.map((slot) => (
//                 <option key={slot} value={slot}>
//                   {TIME_SLOT_LABELS[slot]}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <div>
//           <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department / Area</label>
//           <input
//             type="text"
//             required
//             list="location-suggestions"
//             value={location}
//             onChange={(e) => setLocation(e.target.value)}
//             className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
//           />
//           <datalist id="location-suggestions">
//             {LOCATION_SUGGESTIONS.map((loc) => (
//               <option key={loc} value={loc} />
//             ))}
//           </datalist>
//         </div>

//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-xs font-semibold text-slate-700 mb-1.5">
//               Bird Count (max {maxBirds})
//             </label>
//             <input
//               type="number"
//               min={0}
//               max={maxBirds}
//               required
//               value={birdCount}
//               onChange={(e) => setBirdCount(Number(e.target.value))}
//               className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
//             />
//           </div>
//           <div>
//             <label className="block text-xs font-semibold text-slate-700 mb-1.5">
//               Volunteer Capacity (auto-calculated)
//             </label>
//             <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 bg-slate-100">
//               {computedCapacity} volunteer{computedCapacity === 1 ? "" : "s"}
//             </div>
//           </div>
//         </div>

//         {quarantine && (
//           <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
//             Quarantine shifts are capped at 1 volunteer. Note: the 3-day rolling limit per
//             volunteer can't be enforced here yet — it requires assignment history data that
//             isn't available from a confirmed endpoint.
//           </p>
//         )}

//         {error && (
//           <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
//             {error}
//           </p>
//         )}

//         <div className="flex justify-end gap-3 pt-2">
//           <button
//             type="button"
//             onClick={onCancel}
//             className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
//           >
//             {isSubmitting ? "Saving..." : "Save Changes"}
//           </button>
//         </div>
//       </form>
//     </ModalOverlay>
//   );
// }

// function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
//       <div
//         className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {children}
//       </div>
//     </div>
//   );
