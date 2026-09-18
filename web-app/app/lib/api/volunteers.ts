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

export interface ApiAvailabilitySlot {
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  timeSlot: "Morning" | "Afternoon";
}

/* ============================================================
   ADMIN VOLUNTEER ENDPOINTS (Swagger Section: AdminVolunteer)
   ============================================================ */

// Confirmed: GET /api/admin/volunteers
export async function fetchVolunteers(token: string | null): Promise<Volunteer[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/admin/volunteers`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to fetch volunteers");
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  // Map raw backend keys directly to match your Volunteer interface
  return data.map((item: any) => {
    const fn = item.firstName || "";
    const ln = item.lastName || "";
    const fullName = `${fn} ${ln}`.trim() || item.email || "Volunteer";
    const initials = (fn.charAt(0) + ln.charAt(0)).toUpperCase() || "V";

    return {
      id: String(item.userId ?? item.id ?? item.email),
      initials,
      name: fullName,
      area: item.area || "General",
      email: item.email || "",
      phone: item.phoneNumber || item.phone || "—",
      address: item.address || "—",
      joinedDate: item.joinedDate || "Recent",
      weeklyHoursLogged: item.weeklyHours ?? item.weeklyHoursLogged ?? 0,
      maxWeeklyHours: item.maxWeeklyHours || 40,
      annualHoursLogged: item.annualHoursLogged || 0,
      availability: item.availability || [],
      confirmedShifts: item.confirmedShifts || [],
      nationality: item.nationality || "—",
      ageBracket: item.ageBracket || "18-24",
    };
  });
}

// Confirmed: GET /api/admin/volunteers/{id}
export async function fetchVolunteerById(token: string | null, id: string): Promise<Volunteer> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/admin/volunteers/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to fetch volunteer details");
  }

  const item = await response.json();
  const fn = item.firstName || "";
  const ln = item.lastName || "";

  return {
    id: String(item.userId ?? item.id ?? item.email),
    initials: (fn.charAt(0) + ln.charAt(0)).toUpperCase() || "V",
    name: `${fn} ${ln}`.trim() || item.email || "Volunteer",
    area: item.area || "General",
    email: item.email || "",
    phone: item.phoneNumber || item.phone || "—",
    address: item.address || "—",
    joinedDate: item.joinedDate || "Recent",
    weeklyHoursLogged: item.weeklyHours ?? item.weeklyHoursLogged ?? 0,
    maxWeeklyHours: item.maxWeeklyHours || 40,
    annualHoursLogged: item.annualHoursLogged || 0,
    availability: item.availability || [],
    confirmedShifts: item.confirmedShifts || [],
    nationality: item.nationality || "—",
    ageBracket: item.ageBracket || "18-24",
  };
}

// Confirmed: POST /api/admin/volunteers
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
      availability: payload.availability || [],
      maxWeeklyHours: payload.maxWeeklyHours || 40,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to create volunteer");
  }

  const item = await response.json();
  const fn = item.firstName || payload.firstName;
  const ln = item.lastName || payload.lastName;

  return {
    id: String(item.userId ?? item.id ?? item.email),
    initials: (fn.charAt(0) + ln.charAt(0)).toUpperCase() || "V",
    name: `${fn} ${ln}`.trim(),
    area: item.area || "General",
    email: item.email || payload.email,
    phone: item.phoneNumber || payload.phoneNumber,
    address: item.address || "—",
    joinedDate: item.joinedDate || "Recent",
    weeklyHoursLogged: item.weeklyHours ?? 0,
    maxWeeklyHours: payload.maxWeeklyHours || 40,
    annualHoursLogged: 0,
    availability: payload.availability || [],
    confirmedShifts: [],
    nationality: payload.nationality,
    ageBracket: payload.ageBracket,
  };
}

// Confirmed: PUT /api/admin/volunteers/{id}
export async function updateVolunteer(
  token: string | null,
  id: string,
  updated: Partial<Volunteer>
): Promise<Volunteer> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  const response = await fetch(`${API_URL}/api/admin/volunteers/${id}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updated),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to update volunteer");
  }

  const item = await response.json();
  return {
    ...updated,
    ...item,
    id: String(item.userId ?? id),
  } as Volunteer;
}

/* ============================================================
   CHANGE REQUESTS (Swagger Section: ChangeRequests)
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
    const data = await response.json();
    return Array.isArray(data) ? data : [];
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
   ATTENDANCE (Swagger Section: Attendance)
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
