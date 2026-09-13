import { TimeBlock } from "../services/availability";

export const TIME_SLOT_LABELS: Record<TimeBlock, string> = {
  "08:00-13:00": "Morning",
  "14:00-17:00": "Afternoon",
  "08:00-17:00": "Full Day",
};

export function formatTimeSlotLabel(slot: string): string {
  return (TIME_SLOT_LABELS as Record<string, string>)[slot] ?? slot;
}
