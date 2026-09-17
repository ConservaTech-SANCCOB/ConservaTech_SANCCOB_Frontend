const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ============================================================
   TYPES — match the confirmed backend Swagger schema exactly
   ============================================================ */

export const VALID_TIME_SLOTS = ["08:00-13:00", "14:00-17:00", "08:00-17:00"] as const;
export type TimeSlot = (typeof VALID_TIME_SLOTS)[number];

export interface Shift {
  shiftId: number;
  shiftDate: string;
  timeSlot: string;
  location: string;
  birdCount: number;
  capacity: number;
  requiredSkillIds: number[];
}

export interface ShiftPayload {
  shiftDate: string;
  timeSlot: string;
  location: string;
  birdCount: number;
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

/* ============================================================
   SHIFTS — confirmed: GET/POST/PUT/DELETE /api/shifts
   ============================================================ */

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

export async function createShift(token: string | null, payload: ShiftPayload): Promise<Shift> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/shifts`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to create shift");
  }

  const data: Shift = await response.json();

  console.log("[Create Shift API Response]", data);

  return data;
}

export async function updateShift(
  token: string | null,
  shiftId: number,
  payload: ShiftPayload
): Promise<Shift> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/shifts/${shiftId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to update shift");
  }

  const data: Shift = await response.json();

  console.log("[Update Shift API Response]", data);

  return data;
}

export async function deleteShift(token: string | null, shiftId: number): Promise<void> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/shifts/${shiftId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json, text/plain, */*",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 409) {
    throw new Error(
      "This shift can't be deleted because it's already linked to roster assignments."
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to delete shift");
  }

  console.log("[Delete Shift] Success:", shiftId);
}

/* ============================================================
   VACANCIES — confirmed: read-only, calculated from shift + assignments
   ============================================================ */

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

export async function fetchVacanciesByLocation(
  token: string | null,
  location: string
): Promise<Vacancy[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/vacancies/location/${encodeURIComponent(location)}`, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load vacancies for that location");
  }

  const data: Vacancy[] = await response.json();
  console.log("[Fetch Vacancies By Location API Response]", data);
  return Array.isArray(data) ? data : [];
}

/* ============================================================
   BUSINESS RULE HELPERS
   ============================================================ */

// 1 volunteer per 25 birds, rounded up — matches the backend's own formula.
export function calculateCapacity(birdCount: number, location: string): number {
  if (birdCount <= 0) return 0;
  const computed = Math.ceil(birdCount / 25);
  // Quarantine shifts are capped at 1 volunteer regardless of bird count.
  // NOTE: this cap is enforced here on the frontend as a safeguard; it has not
  // been confirmed whether the backend independently enforces this too.
  if (isQuarantineLocation(location)) {
    return Math.min(computed, 1);
  }
  return computed;
}

export function isQuarantineLocation(location: string): boolean {
  return location.toLowerCase().includes("quarantine");
}

// Quarantine shifts are capped at 25 birds so the computed capacity never exceeds 1.
export function maxBirdsForLocation(location: string): number {
  return isQuarantineLocation(location) ? 25 : 30;
}