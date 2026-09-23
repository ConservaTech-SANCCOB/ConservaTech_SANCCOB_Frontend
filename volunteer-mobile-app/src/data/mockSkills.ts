import { Skill } from "../types/skill";

export const supportingAreas: Skill[] = [
  { id: "s1", name: "Cleaning Station", completed: false },
  { id: "s2", name: "Laundry", completed: false },
  { id: "s3", name: "Assist in Food Prep", completed: false },
  { id: "s4", name: "Supervise Food Prep", completed: false },
  { id: "s5", name: "Cleaning and Pen Routine", completed: false },
  { id: "s6", name: "Home Pen", completed: false },
];

// Draft placeholders for layout review — replace with SANCCOB's real pen routine curriculum.
export const penRoutines: Skill[] = [
  { id: "p1", name: "Pen Preparation", completed: false },
  { id: "p2", name: "Bird Handling", completed: false },
  { id: "p3", name: "Feeding Routine", completed: false },
  { id: "p4", name: "Swim Supervision", completed: false },
  { id: "p5", name: "Daily Health Checks", completed: false },
  { id: "p6", name: "Chick Rearing", completed: false, seasonal: true },
];
