import { api } from "../utils/api";

// --- Real Training API (backend now exposes this — see /api/training/*) ---

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

/** Trainer signs off a volunteer's skill for real. POST-only — the backend has no
 * revoke/undo endpoint, so a sign-off can't be reversed from this app once sent. */
export function signOffTrainingSkill(userId: number, skillId: number, trainerId: number) {
  return api.post<void>(`/api/training/volunteers/${userId}/sign-off`, { skillId, trainerId });
}
