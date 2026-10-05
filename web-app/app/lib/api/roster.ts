import { apiFetch } from "./http";

export interface RosterAssignment {
  rosterAssignmentId: number;
  rosterId: number;
  shiftId: number;
  userId: number; 
  firstName: string | null;
  lastName: string | null;
  shiftDate: string; 
  timeSlot: string | null;
  location: string | null;
  status: string | null; 
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// A weekly roster: its date range, status, when it was generated and the
// list of volunteer assignments it contains.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface Roster {
  rosterId: number;
  weekStartDate: string;
  weekEndDate: string;
  status: string | null; 
  generatedAt: string | null;
  assignments: RosterAssignment[] | null;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Request body for generating an automated roster for the week starting on
// weekStartDate. includedVolunteerIds is confirmed real (Swagger, 5 Oct 2026)
// — IMPORTANT: it's an INCLUDE list, not an exclude list. Send the userIds
// you want considered for this run; omit to presumably mean "everyone in the
// pool" (unconfirmed — verify against a real response before relying on it).
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface GenerateRosterPayload {
  weekStartDate: string;
  includedVolunteerIds?: number[];
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Matches RosterGenerationVolunteerDto (GET /api/Rosters/generation-pool) — a
// week-scoped volunteer pool, distinct from volunteers.ts's Volunteer type
// (no weeklyHours/attendanceRate/etc., since this endpoint exists
// specifically for the generation wizard).
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface RosterGenerationVolunteer {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Request body for manually assigning a volunteer (userId) to a shift (shiftId).
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface ManualRosterAssignmentPayload {
  shiftId: number;
  userId: number;
}


//-----------------------------------------------------------------------------------------------//
//<summary>
// GET /api/Rosters
// Fetches every roster.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function fetchAllRosters(token: string | null): Promise<Roster[]> {
  return apiFetch<Roster[]>("/api/Rosters", token, { method: "GET" }, "Unable to fetch rosters");
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// GET /api/Rosters/{rosterId}
// Fetches a single roster by its ID.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function fetchRosterById(token: string | null, rosterId: number): Promise<Roster> {
  return apiFetch<Roster>(`/api/Rosters/${rosterId}`, token, { method: "GET" }, "Unable to fetch roster");
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// GET /api/Rosters/week/{weekStartDate}
// Fetches the roster for the week starting on the given date.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function fetchWeeklyRoster(
  token: string | null,
  weekStartDate: string
): Promise<Roster> {
  return apiFetch<Roster>(
    `/api/Rosters/week/${encodeURIComponent(weekStartDate)}`,
    token,
    { method: "GET" },
    "Unable to fetch weekly roster"
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// GET /api/Rosters/generation-pool?weekStartDate=
// Fetches the volunteers eligible for roster generation in a given week. Use
// this for the generation wizard instead of volunteers.ts's fetchVolunteers()
// — it's scoped to who's actually eligible that week, not every volunteer in
// the system.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function fetchGenerationPool(
  token: string | null,
  weekStartDate: string
): Promise<RosterGenerationVolunteer[]> {
  return apiFetch<RosterGenerationVolunteer[]>(
    `/api/Rosters/generation-pool?weekStartDate=${encodeURIComponent(weekStartDate)}`,
    token,
    { method: "GET" },
    "Unable to fetch the roster generation pool"
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// POST /api/Rosters/generate
// Asks the backend to automatically generate a roster for the given week.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function generateAutomatedRoster(
  token: string | null,
  payload: GenerateRosterPayload
): Promise<Roster> {
  return apiFetch<Roster>(
    "/api/Rosters/generate",
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to generate automated roster"
  );
}


//-----------------------------------------------------------------------------------------------//
//<summary>
// POST /api/Rosters/{rosterId}/assignments
// Manually adds a volunteer to a shift on the given roster.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function addRosterAssignment(
  token: string | null,
  rosterId: number,
  payload: ManualRosterAssignmentPayload
): Promise<RosterAssignment> {
  return apiFetch<RosterAssignment>(
    `/api/Rosters/${rosterId}/assignments`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to add roster assignment"
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// DELETE /api/Rosters/{rosterId}/assignments/{rosterAssignmentId}
// Removes a volunteer's assignment from the given roster.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function removeRosterAssignment(
  token: string | null,
  rosterId: number,
  rosterAssignmentId: number
): Promise<void> {
  await apiFetch<void>(
    `/api/Rosters/${rosterId}/assignments/${rosterAssignmentId}`,
    token,
    { method: "DELETE" },
    "Failed to remove roster assignment"
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// PATCH /api/Rosters/{rosterId}/publish
// Publishes the given roster and returns the updated roster.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function publishRoster(token: string | null, rosterId: number): Promise<Roster> {
  return apiFetch<Roster>(
    `/api/Rosters/${rosterId}/publish`,
    token,
    { method: "PATCH" },
    "Failed to publish roster"
  );
}


//-----------------------------------------------------------------------------------------------//
//<summary>
// PUT /api/Attendance/{rosterAssignmentId}
// Marks whether the volunteer attended the given roster assignment.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function updateAttendanceStatus(
  token: string | null,
  rosterAssignmentId: number,
  attended: boolean
): Promise<void> {
  await apiFetch<void>(
    `/api/Attendance/${rosterAssignmentId}`,
    token,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attended }),
    },
    "Failed to update attendance status"
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// GET /api/Attendance/{rosterAssignmentId}
// Fetches the attendance record for the given roster assignment. The response
// shape is not typed yet, so it is returned as unknown.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function fetchAttendanceForAssignment(
  token: string | null,
  rosterAssignmentId: number
): Promise<unknown> {
  return apiFetch<unknown>(
    `/api/Attendance/${rosterAssignmentId}`,
    token,
    { method: "GET" },
    "Failed to fetch attendance"
  );
}
//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//