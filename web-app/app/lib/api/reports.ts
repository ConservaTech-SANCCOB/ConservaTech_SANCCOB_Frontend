
//-----------------------------------------------------------------------------------------------//
//<summary>
// Total volunteer hours logged for a single month (one bar/point on the monthly hours chart).
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface MonthlyHours {
  month: string;
  hours: number;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Attendance rate (as a percentage) for a single month on the attendance trend chart.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface AttendancePoint {
  month: string;
  rate: number;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// A volunteer and the total hours they have contributed, used for the top contributors list.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface TopContributor {
  name: string;
  hours: number;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Combined data shape for the Reports page: headline volunteer stats, monthly
// hours, conservation impact figures, attendance by month and top contributors.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface ReportsData {
  totalVolunteerHours: number;
  avgAttendanceRate: number;
  missedShifts: number;
  activeVolunteers: number;
  monthlyHours: MonthlyHours[];
  conservation: {
    totalRescued: number;
    totalReleased: number;
    totalInCare: number;
    percentReleased: number;
  };
  attendanceByMonth: AttendancePoint[];
  topContributors: TopContributor[];
}


const API_URL = process.env.NEXT_PUBLIC_API_URL;

//---------------------------------------------------------------------------------------------------------------//
// API Requests
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Fetches the conservation impact figures (rescued, released, in care, percent
// released) for the given year from the admin dashboard endpoint. Any missing
// values from the backend default to 0.
//</summary>
//-----------------------------------------------------------------------------------------------//
async function fetchConservationImpact(
  token: string | null,
  year: string
): Promise<{
    totalRescued: number;
    totalReleased: number;
    totalInCare: number;
    percentReleased: number;
  }> {
  //-----------------------------------------------------------------------------------------------//
  // Environment Check
  //-----------------------------------------------------------------------------------------------//
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  //-----------------------------------------------------------------------------------------------//
  // Send Request
  //-----------------------------------------------------------------------------------------------//
  const response = await fetch(
    `${API_URL}/api/admin/dashboard/conservation-impact?year=${encodeURIComponent(year)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  //-----------------------------------------------------------------------------------------------//
  // Error Handling
  //-----------------------------------------------------------------------------------------------//
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to fetch conservation impact");
  }

  //-----------------------------------------------------------------------------------------------//
  // Parse & Return Response (missing values default to 0)
  //-----------------------------------------------------------------------------------------------//
  const raw = await response.json();

  return {
    totalRescued: raw.totalRescued ?? 0,
    totalReleased: raw.totalReleased ?? 0,
    totalInCare: raw.totalInCare ?? 0,
    percentReleased: raw.percentReleased ?? 0,
  };
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Fetches the full Reports page data for the given year. Calls the admin reports
// endpoint, then the conservation impact endpoint, and maps the backend field
// names (e.g. averageAttendanceRate, ratePercent, volunteerName) into the
// ReportsData shape used by the UI. Missing values default to 0 or empty arrays.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function fetchReportsData(
  token: string | null,
  year: string,
  department: string
): Promise<ReportsData> {
  //-----------------------------------------------------------------------------------------------//
  // Environment Check
  //-----------------------------------------------------------------------------------------------//
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  //-----------------------------------------------------------------------------------------------//
  // Send Request
  //-----------------------------------------------------------------------------------------------//
  const url = `${API_URL}/api/admin/reports?year=${encodeURIComponent(year)}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  //-----------------------------------------------------------------------------------------------//
  // Error Handling
  //-----------------------------------------------------------------------------------------------//
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Reports request failed with status ${response.status}`);
  }

  //-----------------------------------------------------------------------------------------------//
  // Parse Response & Load Conservation Impact
  //-----------------------------------------------------------------------------------------------//
  const raw = await response.json();
  const conservation = await fetchConservationImpact(token, year);

  //-----------------------------------------------------------------------------------------------//
  // Map Backend Fields to ReportsData
  //-----------------------------------------------------------------------------------------------//
  return {
    totalVolunteerHours: raw.totalVolunteerHours ?? 0,
    avgAttendanceRate: raw.averageAttendanceRate ?? 0,
    missedShifts: raw.missedShifts ?? 0,
    activeVolunteers: raw.activeVolunteers ?? 0,
    monthlyHours: (raw.monthlyHours ?? []).map((m: any) => ({
      month: m.month,
      hours: m.hours,
    })),
    conservation,
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

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//