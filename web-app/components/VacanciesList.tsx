"use client";

import { useState } from "react";
import { useAuth } from "../app/lib/auth-context";
import { notifyOpenVacancy } from "../app/lib/api/notifications";
import { Vacancy, ShiftPayload, updateShift } from "../app/lib/api/shifts";
import { slotKey, SLOT_INFO } from "../app/lib/centre-week";
import { ShiftFormModal } from "./shifts/ShiftFormModal";
import { card, buttonPrimary, buttonOutline } from "./ui/styles";
import { ICONS, LineIcon } from "./ui/line-icon";
import { SlotChip } from "./ui/slot-chip";

//-----------------------------------------------------------------------------------------------//
//<summary>
// Props for VacanciesList: the vacancies to display and a callback that asks
// the parent to reload the data.
//</summary>
//-----------------------------------------------------------------------------------------------//
interface VacanciesListProps {
  vacancies: Vacancy[];
  onRefresh: () => void;
}

const WEEKDAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

//-----------------------------------------------------------------------------------------------//
//<summary>
// Parses a "YYYY-MM-DD" date on the local calendar, the same way the rest of the app
// reads shift dates, so a shift doesn't shift a day backward/forward across time zones.
//</summary>
//-----------------------------------------------------------------------------------------------//
function parseLocalDate(iso: string): Date | null {
  const [y, m, d] = (iso ?? "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// "Today" / "Tomorrow" / "In N days" relative to today, or a short date once it's more
// than a week out or already in the past.
//</summary>
//-----------------------------------------------------------------------------------------------//
function whenLabel(iso: string): string {
  const date = parseLocalDate(iso);
  if (!date) return iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= 13) return `In ${diffDays} days`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Grid of vacancy cards for shifts that still have open spots. Each card shows
// the location, date, time slot, assigned vs capacity and bird count, with
// buttons to edit the shift or notify qualifying volunteers.
//</summary>
//-----------------------------------------------------------------------------------------------//
export default function VacanciesList({ vacancies, onRefresh }: VacanciesListProps) {

  const { token } = useAuth();

  // State for Edit Modal
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);

  // State for Notify Action
  const [notifyingShiftId, setNotifyingShiftId] = useState<number | null>(null);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // 1. EDIT SHIFT / VACANCY HANDLER
  // Saves the edited shift, closes the edit modal and asks the parent to reload.
  // Errors are intentionally NOT caught here: ShiftFormModal catches them and
  // shows the message inside the form.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const handleSaveEdit = async (updatedPayload: ShiftPayload) => {
    if (!editingVacancy) return;
    await updateShift(token, editingVacancy.shiftId, updatedPayload);
    setEditingVacancy(null);
    onRefresh(); // Trigger parent reload
  };

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // 2. NOTIFY QUALIFYING VOLUNTEERS HANDLER
  // Sends a notification about the open vacancy to qualifying volunteers,
  // shows a success banner that auto-dismisses after 4 seconds, and alerts on failure.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const handleNotifyVolunteers = async (vacancy: Vacancy) => {
    setNotifyingShiftId(vacancy.shiftId);
    setNotifySuccess(null);
    try {
      await notifyOpenVacancy(token, vacancy.shiftId);
      setNotifySuccess(`Notification dispatched to qualifying volunteers for Shift #${vacancy.shiftId}`);
      setTimeout(() => setNotifySuccess(null), 4000);
    } catch (err) {
      console.error("Notify failed", err);
      alert(err instanceof Error ? err.message : "Unable to notify volunteers.");
    } finally {
      setNotifyingShiftId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/*------------------------------------ Success Banner ----------------------------------------------------*/}
      {notifySuccess && (
        <div className="bg-ok border border-ok-bar/30 text-ok-ink text-sm font-bold px-4 py-3 rounded-2xl flex items-center justify-between gap-3">
          <span>{notifySuccess}</span>
          <button
            type="button"
            onClick={() => setNotifySuccess(null)}
            className="shrink-0"
            aria-label="Dismiss"
          >
            <LineIcon d={ICONS.close} size={18} />
          </button>
        </div>
      )}

      {/*------------------------------------ Vacancy Row Cards ----------------------------------------------------*/}
      <div className="flex flex-col gap-3">
        {vacancies.map((vacancy) => {
          const isUrgent = vacancy.capacity > 0 && vacancy.assignedVolunteers / vacancy.capacity < 0.5;
          const date = parseLocalDate(vacancy.shiftDate);
          const slot = slotKey(vacancy.timeSlot);
          const isNotifying = notifyingShiftId === vacancy.shiftId;
          const openCount = Math.max(vacancy.vacanciesAvailable, 0);
          const seats = Array.from({ length: vacancy.capacity }, (_, k) => k < vacancy.assignedVolunteers);

          return (
            <div
              key={vacancy.shiftId}
              className={`${card} ${isUrgent ? "border-urgent-line" : ""} p-5 flex flex-wrap items-center gap-4`}
            >
              {/*------------------------------------ Date badge ----------------------------------------------------*/}
              <div className="w-20 shrink-0 rounded-2xl bg-sand text-sand-ink flex flex-col items-center justify-center gap-0.5 py-3">
                <span className="text-3xl font-black leading-none">{date ? date.getDate() : "—"}</span>
                <span className="text-xs font-extrabold tracking-wide">
                  {date ? WEEKDAY_ABBR[date.getDay()] : ""}
                </span>
              </div>

              {/*------------------------------------ Main info ----------------------------------------------------*/}
              <div className="flex-1 min-w-[260px] flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {isUrgent && (
                    <span className="text-xs font-black uppercase tracking-wide text-white bg-[#B42318] rounded-full px-2.5 py-1">
                      Urgent
                    </span>
                  )}
                  <h3 className="font-black text-lg text-ink-strong">{vacancy.location}</h3>
                  <span className="text-sm font-extrabold text-urgent-ink bg-urgent rounded-full px-2.5 py-1">
                    {openCount === 1 ? "1 open spot" : `${openCount} open spots`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <SlotChip slot={slot} />
                  <span className="font-bold text-ink-muted">{SLOT_INFO[slot].time}</span>
                  <span className="font-black text-ink-strong">{whenLabel(vacancy.shiftDate)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    {seats.map((filled, i) => (
                      <span
                        key={i}
                        className={`w-5 h-5 rounded-full ${
                          filled ? "bg-brand" : "border-2 border-dashed border-line-strong"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-extrabold text-ink-strong">
                    {vacancy.assignedVolunteers} of {vacancy.capacity} filled
                  </span>
                  {vacancy.birdCount != null && (
                    <span className="text-sm text-ink-faint">{vacancy.birdCount} birds</span>
                  )}
                </div>
              </div>

              {/*------------------------------------ Actions ----------------------------------------------------*/}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVacancy(vacancy)}
                  className={buttonOutline}
                >
                  <LineIcon d={ICONS.edit} size={16} />
                  Edit shift
                </button>
                <button
                  type="button"
                  onClick={() => handleNotifyVolunteers(vacancy)}
                  disabled={isNotifying}
                  className={buttonPrimary}
                  title="Notify qualified volunteers matching required skill levels"
                >
                  <LineIcon d={ICONS.bell} size={16} />
                  {isNotifying ? "Sending..." : "Notify Qualified"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/*------------------------------------ Edit Modal (reuses the same form as "New Shift" so both stay in sync) ----------------------------------------------------*/}
      {editingVacancy && (
        <ShiftFormModal
          mode="edit"
          shift={editingVacancy}
          onCancel={() => setEditingVacancy(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//