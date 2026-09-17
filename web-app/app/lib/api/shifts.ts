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
   SHIFTS — Swagger Section: Shifts (/api/Shifts)
   ============================================================ */

// GET /api/Shifts
export async function fetchShifts(token: string | null): Promise<Shift[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");

  const response = await fetch(`${API_URL}/api/Shifts`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load shifts");
  }

  const data: Shift[] = await response.json();
  return Array.isArray(data) ? data : [];
}

// POST /api/Shifts
export async function createShift(token: string | null, payload: ShiftPayload): Promise<Shift> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");

  const response = await fetch(`${API_URL}/api/Shifts`, {
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
    throw new Error(errorData.message || "Unable to create shift");
  }

  return await response.json();
}

// PUT /api/Shifts/{id}
export async function updateShift(
  token: string | null,
  shiftId: number,
  payload: ShiftPayload
): Promise<Shift> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");

  const response = await fetch(`${API_URL}/api/Shifts/${shiftId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to update shift");
  }

  return await response.json();
}

// DELETE /api/Shifts/{id}
export async function deleteShift(token: string | null, shiftId: number): Promise<void> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");

  const response = await fetch(`${API_URL}/api/Shifts/${shiftId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
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
}

// GET /api/Shifts/location/{location}
export async function fetchShiftsByLocation(
  token: string | null,
  location: string
): Promise<Shift[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");

  const response = await fetch(`${API_URL}/api/Shifts/location/${encodeURIComponent(location)}`, {
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
   VACANCIES — Swagger Section: Vacancies (/api/Vacancies)
   ============================================================ */

// GET /api/Vacancies
export async function fetchVacancies(token: string | null): Promise<Vacancy[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");

  const response = await fetch(`${API_URL}/api/Vacancies`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];

  const data: Vacancy[] = await response.json();
  return Array.isArray(data) ? data : [];
}

// GET /api/Vacancies/week?weekStartDate=...
export async function fetchVacanciesForWeek(
  token: string | null,
  weekStartDate: string
): Promise<Vacancy[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");

  const response = await fetch(
    `${API_URL}/api/Vacancies/week?weekStartDate=${encodeURIComponent(weekStartDate)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) return [];

  const data: Vacancy[] = await response.json();
  return Array.isArray(data) ? data : [];
}

// GET /api/Vacancies/location/{location}
export async function fetchVacanciesByLocation(
  token: string | null,
  location: string
): Promise<Vacancy[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");

  const response = await fetch(`${API_URL}/api/Vacancies/location/${encodeURIComponent(location)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];

  const data: Vacancy[] = await response.json();
  return Array.isArray(data) ? data : [];
}

/* ============================================================
   BUSINESS RULE HELPERS
   ============================================================ */

export function calculateCapacity(birdCount: number, location: string): number {
  if (birdCount <= 0) return 0;
  const computed = Math.ceil(birdCount / 25);
  if (isQuarantineLocation(location)) {
    return Math.min(computed, 1);
  }
  return computed;
}

export function isQuarantineLocation(location: string): boolean {
  return location.toLowerCase().includes("quarantine");
}

export function maxBirdsForLocation(location: string): number {
  return isQuarantineLocation(location) ? 25 : 30;
}