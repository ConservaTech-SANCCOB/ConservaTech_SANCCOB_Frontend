import { apiFetch } from "./http";

export interface TrainingVolunteerSummary {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  completedSkills: number;
  totalRequiredSkills: number;
  progressPercentage: number;
  trainingStatus: string | null;
}

export interface TrainingSkill {
  skillId: number;
  skillName: string | null;
  category: string | null;
  isSignedOff: boolean;
  trainerId: number | null;
  trainerName: string | null;
  signedOffAt: string | null;
  status: string | null;
}

export interface TrainingVolunteerProfile {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  completedRequiredSkills: number;
  totalRequiredSkills: number;
  progressPercentage: number;
  trainingStatus: string | null;
  supportingAreas: TrainingSkill[] | null;
  penRoutines: TrainingSkill[] | null;
  seasonalSkills: TrainingSkill[] | null;
}

export interface TrainingDashboard {
  totalVolunteers: number;
  activelyTraining: number;
  trained: number;
}

export interface Trainer {
  trainerId: number;
  firstName: string | null;
  lastName: string | null;
}

export async function fetchTrainingVolunteers(token: string | null): Promise<TrainingVolunteerSummary[]> {
  return apiFetch<TrainingVolunteerSummary[]>("/api/training/volunteers", token, { method: "GET" }, "Unable to fetch training volunteers");
}

export async function fetchTrainingVolunteerProfile(userId: number, token: string | null): Promise<TrainingVolunteerProfile> {
  return apiFetch<TrainingVolunteerProfile>(`/api/training/volunteers/${userId}`, token, { method: "GET" }, "Unable to fetch volunteer training profile");
}

export async function fetchTrainingDashboard(token: string | null): Promise<TrainingDashboard> {
  return apiFetch<TrainingDashboard>("/api/training/dashboard", token, { method: "GET" }, "Unable to fetch training dashboard");
}

// NOTE: SignOffSkillDto dropped trainerId in the latest Swagger (25 Sep) —
// backend now expects a trainer to be "selected" via POST /api/trainers/{id}/select
// (likely after PIN verification) as a separate session step, not per sign-off call.
// This function is NOT wired into this page yet — flagged, not built.
export async function signOffSkill(userId: number, skillId: number, token: string | null): Promise<void> {
  return apiFetch<void>(`/api/training/volunteers/${userId}/sign-off`, token, {
    method: "POST",
    body: JSON.stringify({ skillId }),
  }, "Unable to sign off skill");
}

export async function fetchTrainers(token: string | null): Promise<Trainer[]> {
  return apiFetch<Trainer[]>("/api/trainers", token, { method: "GET" }, "Unable to fetch trainers");
}

export interface CreateTrainerRequest {
  firstName: string;
  lastName: string;
}

export async function createTrainer(data: CreateTrainerRequest, token: string | null): Promise<Trainer> {
  return apiFetch<Trainer>("/api/trainers", token, {
    method: "POST",
    body: JSON.stringify(data),
  }, "Unable to create trainer");
}