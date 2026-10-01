export interface MonthlyHours {
  month: string;
  hours: number;
}

export interface AttendancePoint {
  month: string;
  rate: number;
}

export interface TopContributor {
  name: string;
  hours: number;
}

export interface ReportsData {
  totalVolunteerHours: number;
  avgAttendanceRate: number;
  missedShifts: number;
  activeVolunteers: number;
  monthlyHours: MonthlyHours[];
  conservation: {
    totalReleased: number;
    totalInCare: number;
    percentReleased: number;
  };
  attendanceByMonth: AttendancePoint[];
  topContributors: TopContributor[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const MOCK_CONSERVATION = {
  totalReleased: 782,
  totalInCare: 205,
  percentReleased: 79,
};

export async function fetchReportsData(
  token: string | null,
  year: string,
  department: string
): Promise<ReportsData> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const url = `${API_URL}/api/admin/reports?year=${encodeURIComponent(year)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Reports request failed with status ${response.status}`);
  }

  const raw = await response.json();

  return {
    totalVolunteerHours: raw.totalVolunteerHours ?? 0,
    avgAttendanceRate: raw.averageAttendanceRate ?? 0,
    missedShifts: raw.missedShifts ?? 0,
    activeVolunteers: raw.activeVolunteers ?? 0,
    monthlyHours: (raw.monthlyHours ?? []).map((m: any) => ({
      month: m.month,
      hours: m.hours,
    })),
    conservation: MOCK_CONSERVATION,
    attendanceByMonth: (raw.monthlyAttendanceRate ?? []).map((a: any) => ({
      month: a.month,
      rate: a.ratePercent,
    })),
    topContributors: (raw.topContributors ?? []).map((c: any) => ({
      name: c.volunteerName,
      hours: c.totalHours,
    })),
  };
}