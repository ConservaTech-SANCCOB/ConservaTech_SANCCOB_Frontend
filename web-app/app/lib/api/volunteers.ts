const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ============================================================
   TYPES
   ============================================================ */

export interface AvailabilitySlot {
  day: string;
  time: string;
}

export const AGE_BRACKETS = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export type AgeBracket = (typeof AGE_BRACKETS)[number];

export interface Volunteer {
  id: string;
  initials: string;
  name: string;
  area: string;
  email: string;
  phone: string;
  address: string;
  joinedDate: string;
  weeklyHoursLogged: number;
  maxWeeklyHours: number;
  annualHoursLogged: number;
  availability: AvailabilitySlot[];
  confirmedShifts: string[];
  nationality?: string;
  ageBracket: AgeBracket;
}

export interface CreateVolunteerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  ageBracket: AgeBracket;
  availability?: AvailabilitySlot[];
  maxWeeklyHours?: number;
}

export interface ShiftRequest {
  id: string;
  volunteerInitials: string;
  volunteerName: string;
  currentDate: string;
  currentTime: string;
  requestedDate: string;
  requestedTime: string;
  requestType: "Change Date/Time" | "Cancellation";
  reason: string;
  status: "Pending" | "Approved" | "Declined";
}

export interface Shift {
  shiftId: number;
  shiftDate: string;
  timeSlot: string;
  location: string;
  birdCount: number;
  capacity: number;
  requiredSkillIds: number[];
}

export interface Vacancy {
  shiftId: number;
  shiftDate: string;
  timeSlot: string;
  location: string;
  birdCount: number;
  capacity: number;
  assignedVolunteers: number;
  vacanciesAvailable: number;
  requiredSkillIds: number[];
}

export interface ApiAvailabilitySlot {
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  timeSlot: "Morning" | "Afternoon";
}

/* ============================================================
   ADMIN VOLUNTEERS
   ============================================================ */

// Top endpoint cutoff: POST /api/admin/volunteers or /api/Volunteers
export async function createVolunteer(
  token: string | null,
  payload: CreateVolunteerPayload
): Promise<Volunteer> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/admin/volunteers`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      nationality: payload.nationality.trim(),
      ageBracket: payload.ageBracket,
      availability: payload.availability,
      maxWeeklyHours: payload.maxWeeklyHours,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to create volunteer");
  }

  return await response.json();
}

export async function fetchVolunteers(token: string | null): Promise<Volunteer[]> {
  // Temporary local state fallback until GET endpoint is scrolled into view
  return [];
}

/* ============================================================
   CHANGE REQUESTS (Mapped from Swagger "ChangeRequests")
   ============================================================ */

// Matches GET /api/change-requests/pending
export async function fetchShiftRequests(token: string | null): Promise<ShiftRequest[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  try {
    const response = await fetch(`${API_URL}/api/change-requests/pending`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch pending change requests", err);
    return [];
  }
}

// Matches PUT /api/change-requests/{id}/approve
export async function approveShiftRequest(token: string | null, requestId: string): Promise<void> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/change-requests/${requestId}/approve`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Failed to approve request");
}

// Matches PUT /api/change-requests/{id}/decline
export async function declineShiftRequest(token: string | null, requestId: string): Promise<void> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/change-requests/${requestId}/decline`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Failed to decline request");
}

/* ============================================================
   SHIFTS (Mapped from Swagger "Shifts" - PascalCase)
   ============================================================ */

// Matches GET /api/Shifts
export async function fetchShifts(token: string | null): Promise<Shift[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/Shifts`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// Matches GET /api/Shifts/week?weekStartDate=...
export async function fetchShiftsForWeek(token: string | null, weekStartDate: string): Promise<Shift[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(
    `${API_URL}/api/Shifts/week?weekStartDate=${encodeURIComponent(weekStartDate)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/* ============================================================
   VACANCIES (Mapped from Swagger "Vacancies" - PascalCase)
   ============================================================ */

// Matches GET /api/Vacancies
export async function fetchVacancies(token: string | null): Promise<Vacancy[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/Vacancies`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/* ============================================================
   ATTENDANCE (Mapped from Swagger "Attendance")
   ============================================================ */

// Matches GET /api/Attendance/volunteer/{userId}/weekly-hours
export async function fetchWeeklyHours(token: string | null, userId: string): Promise<number> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/Attendance/volunteer/${userId}/weekly-hours`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return 0;
  return await response.json();
}

/* ============================================================
   UTILITY EXPORTS
   ============================================================ */

// export { API_URL };

  // --- MOCK (remove once USE_REAL_API is permanently true) ---
//   await new Promise((resolve) => setTimeout(resolve, 600));

//   return [
//     {
//       id: "r1",
//       volunteerInitials: "AD",
//       volunteerName: "Amahle Dlamini",
//       currentDate: "2026-08-18",
//       currentTime: "07:00–13:00",
//       requestedDate: "2026-08-19",
//       requestedTime: "13:00–18:00",
//       requestType: "Change Date/Time",
//       reason: "Medical appointment...",
//       status: "Pending",
//     },
//     {
//       id: "r2",
//       volunteerInitials: "ZM",
//       volunteerName: "Zanele Mokoena",
//       currentDate: "2026-08-17",
//       currentTime: "13:00–18:00",
//       requestedDate: "2026-08-17",
//       requestedTime: "07:00–13:00",
//       requestType: "Change Date/Time",
//       reason: "Family commitment i...",
//       status: "Pending",
//     },
//     {
//       id: "r3",
//       volunteerInitials: "CA",
//       volunteerName: "Chloe Anderson",
//       currentDate: "2026-08-20",
//       currentTime: "07:00–13:00",
//       requestedDate: "-",
//       requestedTime: "-",
//       requestType: "Cancellation",
//       reason: "Out of town for work",
//       status: "Approved",
//     },
//     {
//       id: "r4",
//       volunteerInitials: "PV",
//       volunteerName: "Pieter van der Merwe",
//       currentDate: "2026-08-16",
//       currentTime: "13:00–18:00",
//       requestedDate: "2026-08-23",
//       requestedTime: "13:00–18:00",
//       requestType: "Change Date/Time",
//       reason: "Conflict with another...",
//       status: "Declined",
//     },
//   ];
// }