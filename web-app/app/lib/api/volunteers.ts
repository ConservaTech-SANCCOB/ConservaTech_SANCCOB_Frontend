import { apiFetch } from "./http";

/* ============================================================
   TYPES  (matched to the backend Swagger schemas)
   ============================================================ */

export const AGE_BRACKETS = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export type AgeBracket = (typeof AGE_BRACKETS)[number];

// Shape of one volunteer in the UI.
// The LIST endpoint only returns: id, names, email, phone, weeklyHours, attendanceRate.
// nationality / ageBracket / emergency contact come from the DETAIL endpoint
// (fetchVolunteerById) and are empty strings on list items.
export interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  weeklyHours: number;
  attendanceRate: number;
  nationality: string;
  ageBracket: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

// POST /api/admin/volunteers  (CreateVolunteerRequestDto)
export interface CreateVolunteerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  ageBracket: string;
}

// PUT /api/admin/volunteers/{id}  (AdminUpdateVolunteerDto)
// firstName, lastName and email are REQUIRED by the backend.
export interface UpdateVolunteerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  ageBracket: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

// Mapped from ChangeRequestDto (GET /api/change-requests/pending)
export interface ShiftRequest {
  id: string; // requestId
  rosterAssignmentId: number;
  volunteerName: string;
  volunteerInitials: string;
  shiftDate: string; // "YYYY-MM-DD"
  timeSlot: string;
  reason: string;
  status: "Pending" | "Approved" | "Declined";
}

/* ============================================================
   RAW BACKEND SHAPES
   ============================================================ */

interface RawVolunteer {
  userId?: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  nationality?: string | null;
  ageBracket?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  weeklyHours?: number;
  attendanceRate?: number;
}

interface RawChangeRequest {
  requestId?: number;
  rosterAssignmentId?: number;
  reason?: string | null;
  status?: string | null;
  shiftDate?: string;
  timeSlot?: string | null;
  volunteerName?: string | null;
}

function mapVolunteer(item: RawVolunteer): Volunteer {
  const firstName = item.firstName ?? "";
  const lastName = item.lastName ?? "";
  const email = item.email ?? "";
  const name = `${firstName} ${lastName}`.trim() || email || "Volunteer";
  const initials =
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() ||
    name.charAt(0).toUpperCase() ||
    "V";

  return {
    id: String(item.userId ?? email),
    firstName,
    lastName,
    name,
    initials,
    email,
    phone: item.phoneNumber ?? "",
    weeklyHours: item.weeklyHours ?? 0,
    attendanceRate: item.attendanceRate ?? 0,
    nationality: item.nationality ?? "",
    ageBracket: item.ageBracket ?? "",
    emergencyContactName: item.emergencyContactName ?? "",
    emergencyContactPhone: item.emergencyContactPhone ?? "",
  };
}

function normaliseStatus(status?: string | null): ShiftRequest["status"] {
  const s = (status ?? "").toLowerCase();
  if (s === "approved") return "Approved";
  if (s === "declined" || s === "rejected") return "Declined";
  return "Pending";
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "V";
  return (parts[0].charAt(0) + (parts[1]?.charAt(0) ?? "")).toUpperCase();
}

/* ============================================================
   ADMIN VOLUNTEER ENDPOINTS
   ============================================================ */

// GET /api/admin/volunteers
export async function fetchVolunteers(token: string | null): Promise<Volunteer[]> {
  const data = await apiFetch<RawVolunteer[]>(
    "/api/admin/volunteers",
    token,
    { method: "GET" },
    "Unable to fetch volunteers"
  );
  return Array.isArray(data) ? data.map(mapVolunteer) : [];
}

// GET /api/admin/volunteers/{id}
export async function fetchVolunteerById(
  token: string | null,
  id: string
): Promise<Volunteer> {
  const item = await apiFetch<RawVolunteer>(
    `/api/admin/volunteers/${id}`,
    token,
    { method: "GET" },
    "Unable to fetch volunteer details"
  );
  return mapVolunteer(item);
}

// POST /api/admin/volunteers
// The response schema is just an echo of the request, so we do NOT rely on it.
// Callers should re-fetch the list afterwards to get the real userId.
export async function createVolunteer(
  token: string | null,
  payload: CreateVolunteerPayload
): Promise<void> {
  await apiFetch(
    "/api/admin/volunteers",
    token,
    {
      method: "POST",
      body: JSON.stringify({
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim(),
        phoneNumber: payload.phoneNumber.trim() || null,
        nationality: payload.nationality.trim() || null,
        ageBracket: payload.ageBracket || null,
      }),
    },
    "Unable to create volunteer"
  );
}

// PUT /api/admin/volunteers/{id}
// Sends every field, so load the full detail record before editing
// (otherwise fields you didn't include may be cleared on the backend).
export async function updateVolunteer(
  token: string | null,
  id: string,
  payload: UpdateVolunteerPayload
): Promise<void> {
  await apiFetch(
    `/api/admin/volunteers/${id}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify({
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim(),
        phoneNumber: payload.phoneNumber.trim() || null,
        nationality: payload.nationality.trim() || null,
        ageBracket: payload.ageBracket || null,
        emergencyContactName: payload.emergencyContactName.trim() || null,
        emergencyContactPhone: payload.emergencyContactPhone.trim() || null,
      }),
    },
    "Unable to update volunteer"
  );
}

/* ============================================================
   CHANGE REQUESTS
   ============================================================ */

// GET /api/change-requests/pending
export async function fetchShiftRequests(token: string | null): Promise<ShiftRequest[]> {
  const data = await apiFetch<RawChangeRequest[]>(
    "/api/change-requests/pending",
    token,
    { method: "GET" },
    "Unable to fetch change requests"
  );

  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const volunteerName = item.volunteerName ?? "Unknown volunteer";
    return {
      id: String(item.requestId ?? ""),
      rosterAssignmentId: item.rosterAssignmentId ?? 0,
      volunteerName,
      volunteerInitials: initialsFromName(volunteerName),
      shiftDate: item.shiftDate ?? "",
      timeSlot: item.timeSlot ?? "",
      reason: item.reason ?? "",
      status: normaliseStatus(item.status),
    };
  });
}

// PUT /api/change-requests/{id}/approve
export async function approveShiftRequest(
  token: string | null,
  requestId: string
): Promise<void> {
  await apiFetch(
    `/api/change-requests/${requestId}/approve`,
    token,
    { method: "PUT" },
    "Failed to approve request"
  );
}

// PUT /api/change-requests/{id}/decline
export async function declineShiftRequest(
  token: string | null,
  requestId: string
): Promise<void> {
  await apiFetch(
    `/api/change-requests/${requestId}/decline`,
    token,
    { method: "PUT" },
    "Failed to decline request"
  );
}