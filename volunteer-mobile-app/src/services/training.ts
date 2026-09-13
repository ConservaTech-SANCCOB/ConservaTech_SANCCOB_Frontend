import { Volunteer } from "../types/volunteer";
import { SkillStatus } from "../types/training";
import { TRAINING_CATALOG } from "../data/mockTrainingCatalog";
import { mockVolunteers } from "../data/mockVolunteers";

// TODO: replace with real endpoints (e.g. GET /api/volunteers, GET/POST a per-volunteer
// training/sign-off endpoint) once the backend exposes Skill / VolunteerSkillProgress
// data — see the README's "Current Integration Status" note on the progress tab.

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getVolunteers(): Promise<Volunteer[]> {
  await delay(300);
  return mockVolunteers;
}

// --- MOCK in-memory store (remove once real endpoints exist) ---
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
