import { api } from "../utils/api";

export interface Vacancy {
  shiftId: number;
  shiftDate: string;
  timeSlot: string;
  location: string | null;
  birdCount: number;
  capacity: number;
  assignedVolunteers: number;
  vacanciesAvailable: number;
  requiredSkillIds: number[];
}

export function getVacancies() {
  return api.get<Vacancy[]>("/api/vacancies");
}
