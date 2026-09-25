import { TimeBlock } from "../services/availability";
import { parseLocalDate } from "./dateBuckets";

export const TIME_SLOT_LABELS: Record<TimeBlock, string> = {
  "08:00-13:00": "Morning",
  "14:00-17:00": "Afternoon",
  "08:00-17:00": "Full Day",
};

export function formatTimeSlotLabel(slot: string): string {
  return (TIME_SLOT_LABELS as Record<string, string>)[slot] ?? slot;
}

export function getTimeSlotHours(slot: string): number {
  const match = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(slot);
  if (!match) return 0;
  const [, startHour, startMinute, endHour, endMinute] = match.map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  return Math.max(0, endMinutes - startMinutes) / 60;
}

export function hasShiftEnded(shiftDate: string, timeSlot: string): boolean {
  const match = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(timeSlot);
  const end = parseLocalDate(shiftDate);
  if (match) {
    end.setHours(Number(match[3]), Number(match[4]), 0, 0);
  } else {
    end.setHours(23, 59, 59, 999);
  }
  return end.getTime() <= Date.now();
}

/** Soonest first: by date, then by the time slot's start (so a morning shift sorts
 * above an afternoon one on the same day). */
export function compareShiftsByStart(
  a: { shiftDate: string; timeSlot: string | null },
  b: { shiftDate: string; timeSlot: string | null }
): number {
  return a.shiftDate.localeCompare(b.shiftDate) || (a.timeSlot ?? "").localeCompare(b.timeSlot ?? "");
}
