import { ShiftLog } from "../types/shift";

export const shiftStats = {
  totalHours: 247,
  totalDays: 62,
  hoursThisMonth: 32,
};

export const mockShifts: ShiftLog[] = [
  { id: "sh1", date: "Monday, 5 Oct", monthLabel: "October 2026", description: "Supporting: Laundry & Food Prep", hours: 5.0, timeRange: "08:00-13:00" },
  { id: "sh2", date: "Wednesday, 7 Oct", monthLabel: "October 2026", description: "Assigned: African Penguin Feed", hours: 9.0, timeRange: "08:00-17:00" },
  { id: "sh3", date: "Friday, 25 Sep", monthLabel: "September 2026", description: "Supporting: Assist in Food Prep", hours: 5.0, timeRange: "08:00-13:00" },
];