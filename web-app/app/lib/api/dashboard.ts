import { apiFetch } from "./http";

/* ============================================================
   TYPES  (matched to the backend Swagger schemas)
   ============================================================ */

// GET /api/admin/dashboard/volunteers-by-age  (VolunteersByAgeDto)
export interface VolunteersByAge {
  volunteersByAge: { age: string | null; count: number }[];
  totalNewRecruits: number;
}

// GET/PUT /api/admin/dashboard/conservation-impact  (ConservationStatsDto)
export interface ConservationStats {
  year: number;
  totalRescued: number;
  totalReleased: number;
  percentReleased: number;
}

// GET /api/admin/dashboard/shift-distribution  (ShiftDistributionDto)
export interface ShiftDistribution {
  totalShifts: number;
  morningCount: number;
  afternoonCount: number;
  morningPercent: number;
  afternoonPercent: number;
}

// GET /api/admin/dashboard/todays-overview  (TodaysShiftDto[])
export interface TodaysShift {
  shiftId: number;
  location: string | null;
  timeSlot: string | null;
  status: string | null;
  volunteerNames: string[] | null;
}

// GET /api/training/volunteers/active  (TrainingVolunteerSummaryDto[])
export interface TrainingVolunteerSummary {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  completedSkills: number;
  totalRequiredSkills: number;
  progressPercentage: number;
  trainingStatus: string | null;
}

/* ============================================================
   REQUESTS
   ============================================================ */

export function fetchVolunteersByAge(token: string | null, year: number) {
  return apiFetch<VolunteersByAge>(
    `/api/admin/dashboard/volunteers-by-age?year=${year}`,
    token,
    {},
    "Couldn't load volunteers by age."
  );
}

export function fetchConservationImpact(token: string | null, year: number) {
  return apiFetch<ConservationStats>(
    `/api/admin/dashboard/conservation-impact?year=${year}`,
    token,
    {},
    "Couldn't load conservation data."
  );
}

// PUT /api/admin/dashboard/conservation-impact  (UpdateConservationStatsDto)
export function updateConservationImpact(
  token: string | null,
  year: number,
  data: { totalRescued: number; totalReleased: number }
) {
  return apiFetch<ConservationStats>(
    `/api/admin/dashboard/conservation-impact?year=${year}`,
    token,
    { method: "PUT", body: JSON.stringify(data) },
    "Couldn't save conservation data."
  );
}

export function fetchShiftDistribution(token: string | null, year: number) {
  return apiFetch<ShiftDistribution>(
    `/api/admin/dashboard/shift-distribution?year=${year}`,
    token,
    {},
    "Couldn't load shift distribution."
  );
}

export function fetchTodaysOverview(token: string | null) {
  return apiFetch<TodaysShift[]>(
    "/api/admin/dashboard/todays-overview",
    token,
    {},
    "Couldn't load today's shifts."
  );
}

export function fetchActiveTraining(token: string | null) {
  return apiFetch<TrainingVolunteerSummary[]>(
    "/api/training/volunteers/active",
    token,
    {},
    "Couldn't load training progress."
  );
}
