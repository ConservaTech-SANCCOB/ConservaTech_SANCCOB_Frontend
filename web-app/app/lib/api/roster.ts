const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ============================================================
   TYPES
   ============================================================ */

export interface RosterAssignment {
  rosterAssignmentId: number;
  shiftId: number;
  userId: string;
  volunteerName: string;
  volunteerInitials: string;
  location: string;
  roleOrArea: string;
  shiftDate: string;
  timeSlot: string;
  attended: boolean;
}

export interface WeeklyRosterSummary {
  weekStartDate: string;
  totalShifts: number;
  filledShifts: number;
  unfilledShifts: number;
  volunteersScheduled: number;
  assignments: RosterAssignment[];
}

export interface GenerateRosterPayload {
  weekStartDate: string;
  excludedVolunteerIds: string[];
}

/* ============================================================
   ROSTER & ATTENDANCE API ENDPOINTS
   ============================================================ */

// GET /api/Roster/week?weekStartDate=...
export async function fetchWeeklyRoster(
  token: string | null,
  weekStartDate: string
): Promise<WeeklyRosterSummary> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(
    `${API_URL}/api/Roster/week?weekStartDate=${encodeURIComponent(weekStartDate)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to fetch weekly roster");
  }

  return await response.json();
}

// POST /api/Roster/generate
export async function generateAutomatedRoster(
  token: string | null,
  payload: GenerateRosterPayload
): Promise<WeeklyRosterSummary> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/Roster/generate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to generate automated roster");
  }

  return await response.json();
}

// POST /api/Roster/publish
export async function publishRoster(
  token: string | null,
  weekStartDate: string
): Promise<void> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/Roster/publish`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ weekStartDate }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to publish roster");
  }
}

// PUT /api/Attendance/{rosterAssignmentId}
export async function updateAttendanceStatus(
  token: string | null,
  rosterAssignmentId: number,
  attended: boolean
): Promise<void> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/Attendance/${rosterAssignmentId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ attended }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update attendance status");
  }
}