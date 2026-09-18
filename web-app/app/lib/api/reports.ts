export interface MonthlyHours {
  month: string;
  hours: number;
}

export interface AttendancePoint {
  month: string;
  rate: number;
}

export interface ShiftFillArea {
  area: string;
  fillRate: number;
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
  shiftFillByArea: ShiftFillArea[];
  topContributors: TopContributor[];
}

// TODO: Replace with a real call once the backend exposes a /reports endpoint.
// Example shape once available:
// const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports?year=${year}&department=${department}`, {
//   headers: { Authorization: `Bearer ${token}` },
// });
// return res.json();

const MOCK_REPORTS_DATA: ReportsData = {
  totalVolunteerHours: 3472,
  avgAttendanceRate: 91,
  missedShifts: 23,
  activeVolunteers: 94,
  monthlyHours: [
    { month: "Jan", hours: 360 },
    { month: "Feb", hours: 400 },
    { month: "Mar", hours: 420 },
    { month: "Apr", hours: 380 },
    { month: "May", hours: 440 },
    { month: "Jun", hours: 470 },
    { month: "Jul", hours: 460 },
    { month: "Aug", hours: 430 },
  ],
  conservation: {
    totalReleased: 782,
    totalInCare: 205,
    percentReleased: 79,
  },
  attendanceByMonth: [
    { month: "Jan", rate: 90 },
    { month: "Feb", rate: 88 },
    { month: "Mar", rate: 93 },
    { month: "Apr", rate: 87 },
    { month: "May", rate: 90 },
    { month: "Jun", rate: 94 },
    { month: "Jul", rate: 88 },
    { month: "Aug", rate: 92 },
  ],
  shiftFillByArea: [
    { area: "Aviary 1", fillRate: 92 },
    { area: "Quarantine", fillRate: 88 },
    { area: "Home Pen", fillRate: 76 },
  ],
  topContributors: [
    { name: "Zanele", hours: 207 },
    { name: "Fatima", hours: 178 },
    { name: "Emma", hours: 156 },
    { name: "Amahle", hours: 142 },
    { name: "Chloe", hours: 124 },
  ],
};

export async function fetchReportsData(
  token: string | null,
  year: string,
  department: string
): Promise<ReportsData> {
  // Mock delay so loading states are visible during development
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_REPORTS_DATA;
}