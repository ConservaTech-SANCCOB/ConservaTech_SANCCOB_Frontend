export type TrainingCategory = "Supporting Areas" | "Pen Routines";

export interface TrainingSkill {
  id: string;
  name: string;
  category: TrainingCategory;
  seasonal?: boolean;
}

export interface SkillStatus {
  skillId: string;
  completed: boolean;
  signedOffBy?: string;
  signedOffDate?: string; // ISO date, e.g. "2026-03-04"
}
