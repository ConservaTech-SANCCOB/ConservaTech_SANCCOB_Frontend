import { apiFetch } from "./http";

export interface DashboardStats {
  volunteersByAge: { age: string; count: number }[];
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

export async function fetchDashboardStats(token: string | null): Promise<DashboardStats> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const currentYear = new Date().getFullYear().toString();

  const conservationRes = await fetch(
    `${API_URL}/api/admin/dashboard/conservation-impact?year=${encodeURIComponent(currentYear)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!conservationRes.ok) {
    const errorData = await conservationRes.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to load conservation impact data");
  }

  const conservationRaw = await conservationRes.json();

  // TODO: volunteersByAge, totalNewRecruits, shifts, todaysShifts, and
  // trainingSessions each need their own confirmed backend endpoint before
  // they can show real data. Ask the backend team whether a single combined
  // /dashboard/stats endpoint exists, or whether each section needs its own
  // call (similar to how conservation-impact works above). Until then these
  // stay empty/zeroed rather than showing fake numbers.
  return {
    volunteersByAge: [
      { age: "18-24", count: 0 },
      { age: "25-34", count: 0 },
      { age: "35-44", count: 0 },
      { age: "45-54", count: 0 },
      { age: "55-64", count: 0 },
      { age: "65+", count: 0 },
    ],
    totalNewRecruits: 0,

    conservation: {
      totalRescued: conservationRaw.totalRescued ?? 0,
      totalReleased: conservationRaw.totalReleased ?? 0,
      percentReleased: conservationRaw.percentReleased ?? 0,
    },

    shifts: {
      totalShifts: 0,
      morningCount: 0,
      afternoonCount: 0,
      morningPercent: 0,
      afternoonPercent: 0,
    },

    todaysShifts: [],

    trainingSessions: [],
  };
}
