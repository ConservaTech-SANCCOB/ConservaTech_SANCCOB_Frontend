import { apiFetch, ApiError } from "./http";

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
  birdCount?: number | null;
  capacity: number;
  requiredSkillIds?: number[] | null;
}

// POST/PUT body matching CreateShiftDto & UpdateShiftDto
export interface ShiftPayload {
  shiftDate: string;
  timeSlot: string;
  location: string;
  birdCount?: number | null;
  capacity?: number | null;
  requiredSkillIds?: number[] | null;
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
  requiredSkillIds?: number[] | null;
}

// Matches components.schemas.ShiftLocationDto
export interface ShiftLocation {
  skillId: number;
  locationName: string;
  locationType: string;
}

// Matches components.schemas.ShiftSkillDto
export interface ShiftSkill {
  skillId: number;
  skillName: string;
}

// Matches components.schemas.ShiftTimeSlotDto
export interface ShiftTimeSlotOption {
  value: string;
  displayName: string;
}

/* ============================================================
   SHIFTS — Swagger Section: Shifts (/api/Shifts)
   ============================================================ */

// GET /api/Shifts
export async function fetchShifts(token: string | null): Promise<Shift[]> {
  const data = await apiFetch<Shift[]>(
    "/api/Shifts",
    token,
    { method: "GET" },
    "Unable to load shifts"
  );
  return Array.isArray(data) ? data : [];
}

// GET /api/Shifts/{id}
export async function fetchShiftById(token: string | null, shiftId: number): Promise<Shift> {
  return apiFetch<Shift>(
    `/api/Shifts/${shiftId}`,
    token,
    { method: "GET" },
    "Unable to load shift"
  );
}

// GET /api/Shifts/week?weekStartDate=...
export async function fetchShiftsForWeek(
  token: string | null,
  weekStartDate: string
): Promise<Shift[]> {
  const data = await apiFetch<Shift[]>(
    `/api/Shifts/week?weekStartDate=${encodeURIComponent(weekStartDate)}`,
    token,
    { method: "GET" },
    "Unable to load shifts for this week"
  );
  return Array.isArray(data) ? data : [];
}

// POST /api/Shifts
export async function createShift(token: string | null, payload: ShiftPayload): Promise<Shift> {
  return apiFetch<Shift>(
    "/api/Shifts",
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Unable to create shift"
  );
}

// PUT /api/Shifts/{id}
export async function updateShift(
  token: string | null,
  shiftId: number,
  payload: ShiftPayload
): Promise<Shift> {
  return apiFetch<Shift>(
    `/api/Shifts/${shiftId}`,
    token,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Unable to update shift"
  );
}

// DELETE /api/Shifts/{id}
export async function deleteShift(token: string | null, shiftId: number): Promise<void> {
  try {
    await apiFetch<void>(
      `/api/Shifts/${shiftId}`,
      token,
      { method: "DELETE" },
      "Unable to delete shift"
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      throw new Error(
        "This shift can't be deleted because it's already linked to roster assignments."
      );
    }
    throw err;
  }
}

// GET /api/Shifts/location/{location}
export async function fetchShiftsByLocation(
  token: string | null,
  location: string
): Promise<Shift[]> {
  const data = await apiFetch<Shift[]>(
    `/api/Shifts/location/${encodeURIComponent(location)}`,
    token,
    { method: "GET" },
    "Unable to load shifts for this location"
  );
  return Array.isArray(data) ? data : [];
}

// GET /api/Shifts/skills
export async function fetchShiftSkills(token: string | null): Promise<ShiftSkill[]> {
  const data = await apiFetch<ShiftSkill[]>(
    "/api/Shifts/skills",
    token,
    { method: "GET" },
    "Unable to load shift skills"
  );
  return Array.isArray(data) ? data : [];
}

// GET /api/Shifts/locations
export async function fetchShiftLocations(token: string | null): Promise<ShiftLocation[]> {
  const data = await apiFetch<ShiftLocation[]>(
    "/api/Shifts/locations",
    token,
    { method: "GET" },
    "Unable to load shift locations"
  );
  return Array.isArray(data) ? data : [];
}

// GET /api/Shifts/time-slots
export async function fetchTimeSlots(token: string | null): Promise<ShiftTimeSlotOption[]> {
  const data = await apiFetch<ShiftTimeSlotOption[]>(
    "/api/Shifts/time-slots",
    token,
    { method: "GET" },
    "Unable to load time slots"
  );
  return Array.isArray(data) ? data : [];
}

/* ============================================================
   VACANCIES — Swagger Section: Vacancies (/api/Vacancies)
   ============================================================ */

// GET /api/Vacancies
export async function fetchVacancies(token: string | null): Promise<Vacancy[]> {
  const data = await apiFetch<Vacancy[]>(
    "/api/Vacancies",
    token,
    { method: "GET" },
    "Unable to load vacancies"
  );
  return Array.isArray(data) ? data : [];
}

// GET /api/Vacancies/week?weekStartDate=...
export async function fetchVacanciesForWeek(
  token: string | null,
  weekStartDate: string
): Promise<Vacancy[]> {
  const data = await apiFetch<Vacancy[]>(
    `/api/Vacancies/week?weekStartDate=${encodeURIComponent(weekStartDate)}`,
    token,
    { method: "GET" },
    "Unable to load vacancies for this week"
  );
  return Array.isArray(data) ? data : [];
}

// GET /api/Vacancies/location/{location}
export async function fetchVacanciesByLocation(
  token: string | null,
  location: string
): Promise<Vacancy[]> {
  const data = await apiFetch<Vacancy[]>(
    `/api/Vacancies/location/${encodeURIComponent(location)}`,
    token,
    { method: "GET" },
    "Unable to load vacancies for this location"
  );
  return Array.isArray(data) ? data : [];
}