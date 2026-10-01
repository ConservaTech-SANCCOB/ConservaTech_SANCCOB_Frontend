import { api } from "../utils/api";

export interface Shift {
  shiftId: number;
  shiftDate: string;
  timeSlot: string;
  location: string | null;
  birdCount: number;
  capacity: number;
  requiredSkillIds: number[];
}

export function getAllShifts() {
  return api.get<Shift[]>("/api/shifts");
}

// ------------------------------------------------------------ //

export interface MyShift {
  rosterAssignmentId: number;
  status: string;
  shiftId: number;
  shiftDate: string;
  timeSlot: string;
  location: string | null;
}

// Includes past shifts so screens filter them
export function getMyShifts() {
  return api.get<MyShift[]>("/api/volunteers/me/shifts");
}

//----------------------------------- END OF FILE ---------------------------------//
