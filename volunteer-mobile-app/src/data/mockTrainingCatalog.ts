import { TrainingSkill } from "../types/training";

// Supporting Areas ids mirror mockSkills.ts's supportingAreas so a future backend
// Skill table lines up with what a volunteer sees on their own Training tab.
// Pen Routines are trainer-facing for now — mockSkills.ts keeps its penRoutines list
// empty on the volunteer side until that part of the app is ready.
export const TRAINING_CATALOG: TrainingSkill[] = [
  { id: "s1", name: "Cleaning Station", category: "Supporting Areas" },
  { id: "s2", name: "Laundry", category: "Supporting Areas" },
  { id: "s3", name: "Assist in Food Prep", category: "Supporting Areas" },
  { id: "s4", name: "Supervise Food Prep", category: "Supporting Areas" },
  { id: "s5", name: "Cleaning and Pen Routine", category: "Supporting Areas" },
  { id: "s6", name: "Home Pen", category: "Supporting Areas" },
  { id: "p1", name: "African Penguin Pen A", category: "Pen Routines" },
  { id: "p2", name: "African Penguin Pen B", category: "Pen Routines" },
  { id: "p3", name: "NUR (Nursery)", category: "Pen Routines" },
  { id: "p4", name: "Seabird ICU", category: "Pen Routines", seasonal: true },
];
