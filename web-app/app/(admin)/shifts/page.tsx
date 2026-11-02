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
import { ICONS, LineIcon } from "../../../components/ui/line-icon";
import { buttonOutline, buttonPrimary, card, cardTitle } from "../../../components/ui/styles";

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
    const [modalState, setModalState] = useState<{
    mode: "create" | "edit";
    shift?: Shift;
    initialDate?: string; // "YYYY-MM-DD", set when creating from a clicked calendar day
   } | null>(null);

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
  // Lookup of shiftId  vacancy, used to find how many volunteers are assigned.
  //</summary>
  const vacancyMap = useMemo(() => {
    const map = new Map<number, Vacancy>();
    vacancies.forEach((v) => map.set(v.shiftId, v));
    return map;
  }, [vacancies]);

//---------------------------------------------------------------------------------------------------------//

  //<summary>
  // Lookup of "YYYY-MM-DD" shifts on that day, used to fill each calendar cell.
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

  function getStatus(shift: Shift): { label: string; color: "green" | "amber" | "red"; assigned: number } {
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
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink-strong tracking-tight">Shift Scheduling</h1>
          <p className="font-semibold text-ink-muted mt-1">
            Which shifts happen each day, and how many volunteers each one needs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setModalState({ mode: "create" })}
            className={buttonPrimary}
          >
            <LineIcon d={ICONS.plus} size={18} strokeWidth={2.6} />
            Add a shift
          </button>
        </div>
      </div>

    {/*------------------------------------ Error banner ----------------------------------------------------*/}
      {errorMessage && (
        <div className="font-bold text-urgent-ink bg-urgent rounded-2xl px-4 py-3">
          {errorMessage}
        </div>
      )}

      {/*------------------------------------ Month Navigation ----------------------------------------------------*/}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-surface-sunken border border-line rounded-full overflow-hidden p-1">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            aria-label="Previous month"
            className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink-strong hover:bg-tint rounded-full transition-colors"
          >
            <LineIcon d={ICONS.chevronLeft} size={18} strokeWidth={2.6} />
          </button>
          <span className="font-black text-ink-strong px-3 min-w-44 text-center">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            aria-label="Next month"
            className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink-strong hover:bg-tint rounded-full transition-colors"
          >
            <LineIcon d={ICONS.chevronRightSm} size={18} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

    {/*------------------------------------ Calendar ----------------------------------------------------*/}

        <div className={`${card} overflow-hidden`}>
          {/* Weekday headings */}
          <div className="grid grid-cols-7 bg-surface-sunken border-b border-line">
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-black text-ink-faint tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks and day cells */}
          {isLoading ? (
            <div className="py-16 text-center text-ink-faint font-semibold">Loading shifts…</div>
          ) : (
            weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-line-soft last:border-b-0">
                {week.map((date, di) => {
                  const dayShifts = date ? shiftsByDate.get(toDateKey(date)) || [] : [];
                  const isToday = date && toDateKey(date) === toDateKey(new Date());
                  return (
                  <div
                      key={di}
                      onClick={
                        date
                          ? () => setModalState({ mode: "create", initialDate: toDateKey(date) })
                          : undefined
                      }
                      title={date ? "Click a shift badge to view details, or click a day to add a shift" : undefined}
                      className={`min-h-[110px] border-r border-line-soft last:border-r-0 p-2 ${
                        date ? "cursor-pointer hover:bg-tint/40 transition-colors" : ""
                      }`}
                    >
                      {date && (
                        <>
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                              isToday ? "bg-brand text-brand-ink" : "text-ink-muted"
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
                                  ? "bg-ok text-ok-ink"
                                  : status.color === "amber"
                                  ? "bg-warn text-warn-ink"
                                  : "bg-urgent text-urgent-ink";
                              return (
                                <button
                                  key={shift.shiftId}
                                    onClick={(e) => {
                                    e.stopPropagation(); // don't also trigger the day click
                                    setSelectedShiftId(shift.shiftId);
                                  }}
                                  className={`w-full text-left px-1.5 py-1 rounded-lg text-[10px] font-extrabold truncate ${colorClasses} ${
                                    selectedShiftId === shift.shiftId ? "ring-2 ring-focus" : ""
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
            <div className={`${card} p-6 text-center`}>
              <LineIcon d={ICONS.calendar} size={40} strokeWidth={1.8} className="mx-auto mb-2 text-ink-faint" />
              <p className="font-black text-ink-strong">No shift selected</p>
              <p className="text-sm font-semibold text-ink-faint mt-1">
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

          <div className={`${card} p-5`}>
            <h3 className="text-xs font-black text-ink-faint uppercase tracking-wider mb-3">
              Capacity Status
            </h3>
            <div className="space-y-2">
              <LegendRow dot="bg-[#2E9A1E]" label="Fully Staffed" />
              <LegendRow dot="bg-[#E8C64A]" label="Understaffed" />
              <LegendRow dot="bg-[#B42318]" label="Over Capacity / Critical" />
            </div>
          </div>
        </div>
      </div>

      {/*------------------------------------ Create / edit modal ----------------------------------------------------*/}

      {modalState && (
        <ShiftFormModal
          mode={modalState.mode}
          shift={
             modalState.shift ??
              (modalState.initialDate ? {shiftDate: modalState.initialDate } : undefined)
          }
          onCancel={() => setModalState(null)}
          onSave={handleSaveShift}
        />
      )}

  {/*------------------------------------ Delete confirmation modal ----------------------------------------------------*/}
      {deletingShift && (
        <ModalOverlay onClose={() => setDeletingShift(null)}>
          <h2 className="text-xl font-black text-ink-strong">Delete Shift</h2>
          <p className="font-semibold text-ink-muted mt-2 mb-6">
            Are you sure you want to delete the {deletingShift.location} shift on{" "}
            {deletingShift.shiftDate}? This can&apos;t be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingShift(null)}
              className={buttonOutline}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="min-h-12 px-5 rounded-full bg-[#B42318] text-white font-extrabold inline-flex items-center justify-center gap-2 hover:bg-[#9A1D14] transition-colors"
            >
              <LineIcon d={ICONS.trash} size={18} strokeWidth={2.2} />
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
  status: { label: string; color: "green" | "amber" | "red"; assigned: number };
  capacityMode: "people" | "birds";
  onCapacityModeChange: (mode: "people" | "birds") => void;
  notes: string;
  onNotesChange: (text: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const barColor =
    status.color === "green" ? "bg-[#2E9A1E]" : status.color === "amber" ? "bg-[#E8C64A]" : "bg-[#B42318]";
  const labelColor =
    status.color === "green" ? "text-ok-ink" : status.color === "amber" ? "text-warn-ink" : "text-urgent-ink";
  const percent = shift.capacity > 0 ? Math.min((status.assigned / shift.capacity) * 100, 100) : 0;

  return (
    <div className={`${card} overflow-hidden`}>

      {/*------------------------------------ Panel header ----------------------------------------------------*/}
      <div className="px-5 pt-5 flex items-start justify-between">
        <div>
          <span className="inline-block text-xs font-black uppercase text-brand bg-tint px-2.5 py-1 rounded-full mb-1.5">
            {TIME_SLOT_LABELS[shift.timeSlot]?.split(" ")[0] || shift.timeSlot}
          </span>
          <h3 className={cardTitle}>{shift.location}</h3>
          <p className="text-sm font-semibold text-ink-faint">
            {shift.shiftDate} · {shift.timeSlot}
          </p>
        </div>
        <button onClick={onClose} className="text-ink-faint hover:text-ink-strong" aria-label="Close">
          <LineIcon d={ICONS.close} size={20} strokeWidth={2.4} />
        </button>
      </div>

      <div className="p-5 space-y-4">
     {/*------------------------------------ Capacity (People / Birds toggle) ----------------------------------------------------*/}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-ink-faint uppercase tracking-wide">Capacity Mode</span>
            <div className="flex rounded-full border border-line overflow-hidden font-extrabold text-xs">
              <button
                onClick={() => onCapacityModeChange("people")}
                className={`px-3 py-1.5 ${capacityMode === "people" ? "bg-brand text-brand-ink" : "text-ink-muted"}`}
              >
                People
              </button>
              <button
                onClick={() => onCapacityModeChange("birds")}
                className={`px-3 py-1.5 ${capacityMode === "birds" ? "bg-brand text-brand-ink" : "text-ink-muted"}`}
              >
                Birds
              </button>
            </div>
          </div>

          {capacityMode === "people" ? (
            <p className="text-2xl font-black text-ink-strong">
              {status.assigned} <span className="text-sm font-semibold text-ink-faint">/ {shift.capacity} Volunteers</span>
            </p>
          ) : (
            <p className="text-2xl font-black text-ink-strong">
              {shift.birdCount ?? 0} <span className="text-sm font-semibold text-ink-faint">Birds</span>
            </p>
          )}
          <div className="w-full h-2 bg-surface-sunken rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
          </div>
          <p className={`text-sm font-extrabold mt-1 ${labelColor}`}>
            {status.label}
          </p>
        </div>

        {/*------------------------------------ Notes (local only) ----------------------------------------------------*/}
        <div>
          <p className="text-xs font-black text-ink-faint uppercase tracking-wide mb-2">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add a note (not saved to the server yet)…"
            rows={3}
            className="w-full font-semibold text-ink-strong placeholder:text-ink-faint border-2 border-line-strong rounded-2xl px-3 py-2 bg-surface-sunken focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/20"
          />
        </div>

        {/*------------------------------------ Actions ----------------------------------------------------*/}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onEdit}
            className={`${buttonPrimary} flex-1 !min-h-11`}
          >
            <LineIcon d={ICONS.edit} size={16} strokeWidth={2.2} />
            Edit Shift
          </button>
          <button
            onClick={onDelete}
            className="min-h-11 px-4 rounded-full border-2 border-[#E2A39C] bg-surface text-[#B42318] font-extrabold inline-flex items-center gap-2 hover:bg-urgent transition-colors"
          >
            <LineIcon d={ICONS.trash} size={16} strokeWidth={2.2} />
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
function LegendRow({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className="font-semibold text-ink-muted">{label}</span>
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//