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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://sanccob-backend-api-btgscudjhbcdddf8.spaincentral-01.azurewebsites.net";

// The backend doesn't return conservation impact data on this endpoint yet,
// so this section stays mocked until that's added on the backend side.
const MOCK_CONSERVATION = {
  totalReleased: 782,
  totalInCare: 205,
  percentReleased: 79,
};

export async function fetchReportsData(
  token: string | null,
  year: string,
  department: string // kept in the signature for the UI, but not sent — the backend doesn't support a department filter yet
): Promise<ReportsData> {
  const url = `${API_BASE_URL}/api/admin/reports?year=${encodeURIComponent(year)}`;

  console.log("Fetching reports from:", url);

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error(`Reports request failed with status ${res.status}`);
  }

  const raw = await res.json();

  console.log("REAL API RESPONSE:", raw);

  const mapped: ReportsData = {
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

  return mapped;
}