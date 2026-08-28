import { Skill } from "../types/skill";

export const supportingAreas: Skill[] = [
  { id: "s1", name: "Cleaning Station", completed: true },
  { id: "s2", name: "Laundry", completed: true },
  { id: "s3", name: "Assist in Food Prep", completed: true },
  { id: "s4", name: "Supervise Food Prep", completed: true },
  { id: "s5", name: "Cleaning and Pen Routine", completed: false },
  { id: "s6", name: "Home Pen", completed: false },
];

export const penRoutines: Skill[] = [
  { id: "p1", name: "Aviary Routine", completed: true },
  { id: "p2", name: "Aviary 1", completed: true },
  { id: "p3", name: "Hartlaub's Gull Handling", completed: true },
  { id: "p4", name: "Hartlaub's Gull Tubing", completed: true },
  { id: "p5", name: "Kelp Gull Handling", completed: true },
  { id: "p6", name: "Kelp Gull Tubing", completed: true },
  { id: "p7", name: "African Penguin Handling", completed: true },
  { id: "p8", name: "African Penguin Feeding", completed: true },
  { id: "p9", name: "African Penguin Tubing", completed: true },
  { id: "p10", name: "Pen Supervisor", completed: true },
  { id: "p11", name: "PCV", completed: false },
  { id: "p12", name: "Nebuliser", completed: false },
  { id: "p13", name: "Drawing Up Medication", completed: false },
  { id: "p14", name: "Administering Medications", completed: false },
  { id: "p15", name: "Holding for Checks, Bleeds and Transponder", completed: false },
  { id: "p16", name: "Updating Patient Online Profiles (WRMD)", completed: false },
  { id: "p17", name: "Cape Cormorant Handling", completed: false, seasonal: true },
  { id: "p18", name: "Quarantine", completed: false },
  { id: "p19", name: "Quarantine Runner", completed: false },
  { id: "p20", name: "Cape Gannet Handling", completed: false, seasonal: true },
  { id: "p21", name: "Cape Gannet Feeding", completed: false, seasonal: true },
  { id: "p22", name: "Cape Gannet Tubing", completed: false, seasonal: true },
  { id: "p23", name: "Assisting in NUR", completed: false },
];