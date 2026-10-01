import { apiFetch } from "./http";

/* ============================================================
   TYPES — mirrored directly from Swagger (verified 22 Sep 2026)
   ============================================================ */

// Matches components.schemas.RosterAssignmentDto
export interface RosterAssignment {
  rosterAssignmentId: number;
  rosterId: number;
  shiftId: number;
  userId: number; // backend int32, NOT string
  firstName: string | null;
  lastName: string | null;
  shiftDate: string; // date
  timeSlot: string | null;
  location: string | null;
  status: string | null; // scale/valid values unconfirmed — console.log a real response before relying on it
}

// Matches components.schemas.RosterDto
export interface Roster {
  rosterId: number;
  weekStartDate: string;
  weekEndDate: string;
  status: string | null; // e.g. Draft/Published — confirm exact strings against a real response
  generatedAt: string | null;
  assignments: RosterAssignment[] | null;
}

// Matches components.schemas.GenerateRosterDto
// NOTE: the real backend only accepts weekStartDate. There is currently no
// field for excluding volunteers from generation — that UI control does not
// do anything against the real API until the backend adds support for it.
export interface GenerateRosterPayload {
  weekStartDate: string;
}

// Matches components.schemas.ManualRosterAssignmentDto
export interface ManualRosterAssignmentPayload {
  shiftId: number;
  userId: number;
}

/* ============================================================
   ROSTER API ENDPOINTS
   ============================================================ */

// GET /api/Rosters
export async function fetchAllRosters(token: string | null): Promise<Roster[]> {
  return apiFetch<Roster[]>("/api/Rosters", token, { method: "GET" }, "Unable to fetch rosters");
}

// GET /api/Rosters/{rosterId}
export async function fetchRosterById(token: string | null, rosterId: number): Promise<Roster> {
  return apiFetch<Roster>(`/api/Rosters/${rosterId}`, token, { method: "GET" }, "Unable to fetch roster");
}

// GET /api/Rosters/week/{weekStartDate}
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

// POST /api/Rosters/generate
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

// POST /api/Rosters/{rosterId}/assignments
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

// DELETE /api/Rosters/{rosterId}/assignments/{rosterAssignmentId}
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

// PATCH /api/Rosters/{rosterId}/publish
// NOTE: publishing requires the numeric rosterId (from a previously fetched
// Roster), NOT a weekStartDate. The caller must fetch/generate the roster
// first to get its rosterId before calling this.
export async function publishRoster(token: string | null, rosterId: number): Promise<Roster> {
  return apiFetch<Roster>(
    `/api/Rosters/${rosterId}/publish`,
    token,
    { method: "PATCH" },
    "Failed to publish roster"
  );
}

/* ============================================================
   ATTENDANCE API ENDPOINTS (used from the roster page)
   ============================================================ */

// PUT /api/Attendance/{rosterAssignmentId}
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

// GET /api/Attendance/{rosterAssignmentId}
// Response shape not documented in Swagger — console.log a real response
// before building UI on top of this.
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