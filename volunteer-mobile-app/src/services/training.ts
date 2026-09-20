import { api } from "../utils/api";
import { Volunteer } from "../types/volunteer";
import { SkillStatus } from "../types/training";
import { TRAINING_CATALOG } from "../data/mockTrainingCatalog";
import { mockVolunteers } from "../data/mockVolunteers";

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

// --- MOCK scaffolding below (dead now that the screens above call the real API) ---

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getVolunteers(): Promise<Volunteer[]> {
  await delay(300);
  return mockVolunteers;
}

// Keyed by volunteerId -> that volunteer's status for every skill in TRAINING_CATALOG.
const store = new Map<string, SkillStatus[]>();

// Seed data so the dashboard demos with a realistic mix of complete/incomplete skills.
const SEED: Record<string, { skillId: string; signedOffDate: string }[]> = {
  v1: [
    { skillId: "s1", signedOffDate: "2025-04-02" },
    { skillId: "s2", signedOffDate: "2025-04-02" },
    { skillId: "s3", signedOffDate: "2025-05-10" },
    { skillId: "p1", signedOffDate: "2025-06-20" },
  ],
  v2: [
    { skillId: "s1", signedOffDate: "2024-11-15" },
    { skillId: "s2", signedOffDate: "2024-11-15" },
  ],
  v3: [
    { skillId: "s1", signedOffDate: "2025-02-01" },
    { skillId: "s2", signedOffDate: "2025-02-01" },
    { skillId: "s3", signedOffDate: "2025-02-14" },
    { skillId: "s4", signedOffDate: "2025-03-01" },
    { skillId: "s5", signedOffDate: "2025-03-01" },
    { skillId: "p1", signedOffDate: "2025-04-18" },
    { skillId: "p2", signedOffDate: "2025-05-02" },
  ],
};

function getOrSeed(volunteerId: string): SkillStatus[] {
  if (!store.has(volunteerId)) {
    const seed = SEED[volunteerId] ?? [];
    const seedMap = new Map(seed.map((s) => [s.skillId, s.signedOffDate]));

    store.set(
      volunteerId,
      TRAINING_CATALOG.map((skill) => {
        const signedOffDate = seedMap.get(skill.id);
        return signedOffDate
          ? { skillId: skill.id, completed: true, signedOffBy: "Sarah Naidoo", signedOffDate }
          : { skillId: skill.id, completed: false };
      })
    );
  }
  return store.get(volunteerId)!;
}

/** All skill statuses for one volunteer (both completed and outstanding). */
export async function getVolunteerTraining(volunteerId: string): Promise<SkillStatus[]> {
  await delay(250);
  return getOrSeed(volunteerId).map((status) => ({ ...status }));
}

/** Trainer signs off that a volunteer has completed a specific piece of training. */
export async function signOffSkill(
  volunteerId: string,
  skillId: string,
  signedOffBy: string
): Promise<SkillStatus> {
  await delay(200);
  const list = getOrSeed(volunteerId);
  const updated: SkillStatus = {
    skillId,
    completed: true,
    signedOffBy,
    signedOffDate: new Date().toISOString().split("T")[0],
  };
  const idx = list.findIndex((s) => s.skillId === skillId);
  if (idx >= 0) list[idx] = updated;
  else list.push(updated);
  return updated;
}

/** Reverses a sign-off (e.g. it was recorded in error). */
export async function revokeSignOff(volunteerId: string, skillId: string): Promise<SkillStatus> {
  await delay(200);
  const list = getOrSeed(volunteerId);
  const updated: SkillStatus = { skillId, completed: false };
  const idx = list.findIndex((s) => s.skillId === skillId);
  if (idx >= 0) list[idx] = updated;
  else list.push(updated);
  return updated;
}
