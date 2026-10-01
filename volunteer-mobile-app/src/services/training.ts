import { api } from "../utils/api";

export interface TrainingVolunteerSummary {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  completedSkills: number;
  totalRequiredSkills: number;
  progressPercentage: number;
  trainingStatus: string | null;
}

export function getTrainingVolunteers() {
  return api.get<TrainingVolunteerSummary[]>("/api/training/volunteers");
}

export interface TrainingSkillDto {
  skillId: number;
  skillName: string | null;
  category: string | null;
  isSignedOff: boolean;
  trainerId: number | null;
  trainerName: string | null;
  signedOffAt: string | null;
}

export interface TrainingVolunteerProfile {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  completedRequiredSkills: number;
  totalRequiredSkills: number;
  progressPercentage: number;
  trainingStatus: string | null;
  supportingAreas: TrainingSkillDto[] | null;
  penRoutines: TrainingSkillDto[] | null;
  seasonalSkills: TrainingSkillDto[] | null;
}

export function getTrainingVolunteerProfile(userId: number) {
  return api.get<TrainingVolunteerProfile>(`/api/training/volunteers/${userId}`);
}

export function signOffTrainingSkill(userId: number, skillId: number) {
  return api.post<void>(`/api/training/volunteers/${userId}/sign-off`, { skillId });
}

export function getMyTrainingProfile() {
  return api.get<TrainingVolunteerProfile>("/api/volunteers/me/training/profile");
}

export interface CompletedShift {
  shiftDate: string;
  timeSlot: string | null;
  location: string | null;
  hoursWorked: number;
}

export interface MyTrainingStats {
  totalHours: number;
  shiftsCompleted: number;
  hoursThisMonth: number;
  completedShifts: CompletedShift[] | null;
}

export function getMyTrainingStats() {
  return api.get<MyTrainingStats>("/api/volunteers/me/training/stats");
}
