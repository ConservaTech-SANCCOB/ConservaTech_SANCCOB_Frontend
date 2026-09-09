import { api } from "../utils/api";

export type TimeBlock = "08:00-13:00" | "14:00-17:00" | "08:00-17:00";

export interface AvailabilitySlot {
  dayOfWeek: string;
  timeSlot: TimeBlock;
}

export function getMyAvailability() {
  return api.get<AvailabilitySlot[]>("/api/volunteers/me/availability");
}

export function updateMyAvailability(slots: AvailabilitySlot[]) {
  return api.put<void>("/api/volunteers/me/availability", { slots });
}