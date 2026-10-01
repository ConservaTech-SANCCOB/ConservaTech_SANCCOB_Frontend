import { api } from "../utils/api";

// The only slots the backend accepts
export type TimeBlock = "08:00-13:00" | "14:00-17:00" | "08:00-17:00";

export interface AvailabilitySlot {
  dayOfWeek: string;
  timeSlot: TimeBlock;
}

export function getMyAvailability() {
  return api.get<AvailabilitySlot[]>("/api/volunteers/me/availability");
}

// ------------------------------------------------------------ //

// Replaces all saved availability so empty clears it
export function updateMyAvailability(slots: AvailabilitySlot[]) {
  return api.put<void>("/api/volunteers/me/availability", { slots });
}

//----------------------------------- END OF FILE ---------------------------------//
