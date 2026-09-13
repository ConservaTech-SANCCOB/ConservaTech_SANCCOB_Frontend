const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ============================================================
   TYPES
   Matches the exact backend Swagger response schema where confirmed.
   ============================================================ */

export interface AvailabilitySlot {
  day: string;
  time: string;
}

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
  ageBracket?: string;
}

export interface CreateVolunteerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  ageBracket: string;
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

/**
 * IMPORTANT: There is currently no confirmed GET /api/admin/volunteers
 * endpoint in the backend's Swagger docs. This does not invent one —
 * it returns an empty list until the backend team confirms the route.
 */
export async function fetchVolunteers(token: string | null): Promise<Volunteer[]> {
  console.warn("GET /api/admin/volunteers is not currently documented by the backend.");
  return [];
}

// Confirmed endpoint: POST /api/admin/volunteers
export async function createVolunteer(
  token: string | null,
  payload: CreateVolunteerPayload
): Promise<Volunteer> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/admin/volunteers`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      nationality: payload.nationality.trim(),
      ageBracket: payload.ageBracket.trim(),
      availability: payload.availability,
      maxWeeklyHours: payload.maxWeeklyHours,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to create volunteer");
  }

  const data: Volunteer = await response.json();

  console.log("[Create Volunteer API Response]", data);

  return data;
}

/* ============================================================
   SHIFT REQUESTS
   ============================================================ */

/**
 * There is currently no confirmed admin shift-request endpoint.
 * Returns an empty array rather than calling an undocumented route.
 */
export async function fetchShiftRequests(token: string | null): Promise<ShiftRequest[]> {
  console.warn("Admin shift-request endpoints are not currently documented by the backend.");
  return [];
}

/* ============================================================
   SHIFTS
   ============================================================ */

// Confirmed endpoint: GET /api/shifts
export async function fetchShifts(token: string | null): Promise<Shift[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/shifts`, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load shifts");
  }

  const data: Shift[] = await response.json();

  console.log("[Fetch Shifts API Response]", data);

  return Array.isArray(data) ? data : [];
}

// Confirmed endpoint: GET /api/shifts/week?weekStartDate=...
export async function fetchShiftsForWeek(
  token: string | null,
  weekStartDate: string
): Promise<Shift[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(
    `${API_URL}/api/shifts/week?weekStartDate=${encodeURIComponent(weekStartDate)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load weekly shifts");
  }

  const data: Shift[] = await response.json();

  console.log("[Fetch Shifts For Week API Response]", data);

  return Array.isArray(data) ? data : [];
}

// Confirmed endpoint: GET /api/shifts/{shiftId}
export async function fetchShift(token: string | null, shiftId: number): Promise<Shift> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/shifts/${shiftId}`, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load shift");
  }

  const data: Shift = await response.json();

  console.log("[Fetch Shift API Response]", data);

  return data;
}

/* ============================================================
   VACANCIES
   ============================================================ */

// Confirmed endpoint: GET /api/vacancies
export async function fetchVacancies(token: string | null): Promise<Vacancy[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/vacancies`, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load vacancies");
  }

  const data: Vacancy[] = await response.json();

  console.log("[Fetch Vacancies API Response]", data);

  return Array.isArray(data) ? data : [];
}

// Confirmed endpoint: GET /api/vacancies/week?weekStartDate=...
export async function fetchVacanciesForWeek(
  token: string | null,
  weekStartDate: string
): Promise<Vacancy[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(
    `${API_URL}/api/vacancies/week?weekStartDate=${encodeURIComponent(weekStartDate)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load weekly vacancies");
  }

  const data: Vacancy[] = await response.json();

  console.log("[Fetch Vacancies For Week API Response]", data);

  return Array.isArray(data) ? data : [];
}

// Confirmed endpoint: GET /api/vacancies/{shiftId}
export async function fetchVacancy(token: string | null, shiftId: number): Promise<Vacancy> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/vacancies/${shiftId}`, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load vacancy");
  }

  const data: Vacancy = await response.json();

  console.log("[Fetch Vacancy API Response]", data);

  return data;
}

/* ============================================================
   VOLUNTEER MOBILE AVAILABILITY
   These apply to the logged-in volunteer, not an arbitrary admin lookup.
   ============================================================ */

// Confirmed endpoint: GET /api/volunteers/me/availability
export async function fetchMyAvailability(token: string | null): Promise<ApiAvailabilitySlot[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/volunteers/me/availability`, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load availability");
  }

  const data: ApiAvailabilitySlot[] = await response.json();

  console.log("[Fetch My Availability API Response]", data);

  return Array.isArray(data) ? data : [];
}

// Confirmed endpoint: PUT /api/volunteers/me/availability
export async function updateMyAvailability(
  token: string | null,
  slots: ApiAvailabilitySlot[]
): Promise<void> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/volunteers/me/availability`, {
    method: "PUT",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ slots }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to update availability");
  }

  console.log("[Update My Availability] Success");
}

/* ============================================================
   UTILITY EXPORTS
   ============================================================ */

export { API_URL };

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