"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalOverlay, ShiftFormModal } from "../../../components/shifts/ShiftFormModal";
import { useAuth } from "../../lib/auth-context";
import {
  fetchShifts,
  fetchVacancies,
  createShift,
  updateShift,
  deleteShift,
  Shift,
  Vacancy,
  ShiftPayload,
} from "../../lib/api/shifts";

//-----------------------------------------------------------------------------------------------//

//<summary>
// Friendly labels for each time slot, used in the shift detail panel.
//</summary>
const TIME_SLOT_LABELS: Record<string, string> = {
  "08:00-13:00": "Morning (08:00-13:00)",
  "14:00-17:00": "Afternoon (14:00-17:00)",
  "08:00-17:00": "Full Day (08:00-17:00)",
};

//-----------------------------------------------------------------------------------------------//

//<summary>
// Column headings for the calendar, Sunday first to match Date.getDay().
//</summary>
const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

//-------------------------------------------------------------------------------------------------//

//<summary>
// Turns a Date into a "YYYY-MM-DD" key using the LOCAL calendar day.
// Used to match calendar cells to shifts (the API sends shiftDate as "YYYY-MM-DD").
// Do not use toISOString() here: it converts to UTC, which puts the key one day early
// in timezones ahead of UTC (e.g. South Africa, UTC+2).
//</summary>
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

//---------------------------------------------------------------------------------------------------------------//

//<summary>
// Builds the month grid as an array of weeks, each with 7 cells.
// A cell is a Date for a day in the month, or null for padding before the 1st
// and after the last day.
//</summary>
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

//---------------------------------------------------------------------------------------------------------------//

//<summary>
// Shift Scheduling page: a month calendar of shifts with a detail side panel.
// Admins can create, edit and delete shifts. Badge colours show how fully staffed each shift is.
//</summary>
export default function ShiftSchedulingPage() {
  const { token } = useAuth();

  //<summary>
  // Data loaded from the API, plus loading and error state.
  //</summary>
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  //<summary>
  // UI state: the month being viewed, the selected shift, and the People/Birds toggle.
  //</summary>
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [capacityMode, setCapacityMode] = useState<"people" | "birds">("people");

  //<summary>
  // Ephemeral, local-only notes keyed by shiftId. Not saved to the server.
  //</summary>
  const [notesByShiftId, setNotesByShiftId] = useState<Record<number, string>>({});

  //<summary>
  // Modal state: the create/edit form (null = closed) and the shift awaiting delete confirmation.
  //</summary>
  const [modalState, setModalState] = useState<{ mode: "create" | "edit"; shift?: Shift } | null>(
    null
  );
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  //------------------------------------------------------------------------------------------------------//

  //<summary>
  // Loads shifts and vacancies together. Called on page load and after every save.
  //</summary>
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

//------------------------------------------------------------------------------------------------------//

  //<summary>
  // Loads the data when the page opens (and again if the token changes).
  //</summary>
  useEffect(() => {
    loadData();
  }, [token]);

 //------------------------------------------------------------------------------------------------------//

  //<summary>
  // Lookup of shiftId -> vacancy, used to find how many volunteers are assigned.
  //</summary>
  const vacancyMap = useMemo(() => {
    const map = new Map<number, Vacancy>();
    vacancies.forEach((v) => map.set(v.shiftId, v));
    return map;
  }, [vacancies]);

//---------------------------------------------------------------------------------------------------------//

  //<summary>
  // Lookup of "YYYY-MM-DD" -> shifts on that day, used to fill each calendar cell.
  //</summary>
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    shifts.forEach((shift) => {
      const list = map.get(shift.shiftDate) || [];
      list.push(shift);
      map.set(shift.shiftDate, list);
    });
    return map;
  }, [shifts]);

  //------------------------------------------------------------------------------------------------------//

  const selectedShift = shifts.find((s) => s.shiftId === selectedShiftId) || null;
  const weeks = getMonthGrid(currentMonth);

//--------------------------------------------------------------------------------------------------------//

  //<summary>
  // Works out how staffed a shift is and which colour badge to show.
  // - A shift with no vacancy entry is treated as fully staffed. This relies on
  //   /api/Vacancies only returning shifts that still have open spots.
  // - Fully Staffed (green): assigned equals capacity.
  // - Over Capacity (red): assigned exceeds capacity.
  // - Critical (red): under half staffed.
  // - Understaffed (amber): half or more staffed, but not full.
  //</summary>

  function getStatus(shift: Shift): { label: string; color: string; assigned: number } {
    const vacancy = vacancyMap.get(shift.shiftId);
    const assigned = vacancy ? vacancy.assignedVolunteers : shift.capacity;
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

 //--------------------------------------------------------------------------------------------------------//

  //<summary>
  // Saves the shift from the form: updates an existing shift or creates a new one,
  // then reloads the data and closes the modal. Errors are left to ShiftFormModal,
  // which shows them inside the form.
  //</summary>
  async function handleSaveShift(payload: ShiftPayload) {
    if (modalState?.mode === "edit" && modalState.shift) {
      const saved = await updateShift(token, modalState.shift.shiftId, payload);
      setShifts((prev) => prev.map((s) => (s.shiftId === saved.shiftId ? saved : s)));
    } else {
      const saved = await createShift(token, payload);
      setShifts((prev) => [...prev, saved]);
    }

    await loadData();
    setModalState(null);
  }

 //--------------------------------------------------------------------------------------------------------//

  //<summary>
  // Deletes the shift chosen in the confirmation dialog and removes it from the calendar.
  // The backend refuses (409) if the shift is linked to roster assignments;
  // the message is shown in the error banner.
  //</summary>
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
      
   {/*------------------------------------ Page header: title, month navigation, New Shift button ----------------------------------------------------*/}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shift Scheduling</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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

    {/*------------------------------------ Error banner ----------------------------------------------------*/}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

    {/*------------------------------------ Calendar ----------------------------------------------------*/}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Weekday headings */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-bold text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks and day cells */}
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
                          {/* Shift badges for this day */}
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

   {/*------------------------------------ Side panel: shift details + status legend ----------------------------------------------------*/}
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

      {/*------------------------------------ Create / edit modal ----------------------------------------------------*/}

      {modalState && (
        <ShiftFormModal
          mode={modalState.mode}
          shift={modalState.shift}
          onCancel={() => setModalState(null)}
          onSave={handleSaveShift}
        />
      )}

  {/*------------------------------------ Delete confirmation modal ----------------------------------------------------*/}
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

//---------------------------------------------------------------------------------------------------------------------//

//<summary>
// Side panel for the selected shift: time slot, location, date, capacity (people or birds),
// a progress bar, assigned volunteers placeholder, local notes, and Edit / Delete buttons.
//</summary>
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

      {/*------------------------------------ Panel header ----------------------------------------------------*/}
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
     {/*------------------------------------ Capacity (People / Birds toggle) ----------------------------------------------------*/}
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
              {shift.birdCount ?? 0} <span className="text-sm font-normal text-slate-400">Birds</span>
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

        {/*------------------------------------ Assigned volunteers (placeholder) ----------------------------------------------------*/}
        {/* <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Assigned Volunteers</p>
          <p className="text-xs text-slate-400 italic bg-slate-50 rounded-lg px-3 py-3">
            Volunteer names aren't available yet — the backend currently only returns a count
            ({status.assigned} assigned), not who they are.
          </p>
        </div> */}

        {/*------------------------------------ Notes (local only) ----------------------------------------------------*/}
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

        {/*------------------------------------ Actions ----------------------------------------------------*/}
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

//---------------------------------------------------------------------------------------------------------------------//

//<summary>
// One row of the status legend: a coloured dot and its label.
//</summary>
function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-slate-600">{label}</span>
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//