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

export interface MyShift {
  rosterAssignmentId: number;
  status: string;
  shiftId: number;
  shiftDate: string;
  timeSlot: string;
  location: string | null;
}

export function getMyShifts() {
  return api.get<MyShift[]>("/api/volunteers/me/shifts");
}
