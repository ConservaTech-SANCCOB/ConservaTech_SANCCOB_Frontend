import { apiFetch, ApiError } from "./http";

/* ============================================================
   TYPES — match the confirmed backend Swagger schema exactly
   ============================================================ */

// Prefer fetchTimeSlots() over this hardcoded list where possible — this is
// kept only as a fallback since some parts of the UI need synchronous access
// to valid slots (e.g. form defaults) before data has loaded.
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

// POST/PUT body.
// For BIRD locations: omit `capacity` entirely and let the backend calculate it
// from `birdCount` (birdCount / 25 rounded up, max 30 birds) — this is confirmed
// working. Do not send capacity in this case.
// For NON-BIRD locations (e.g. Food Preparation): birdCount is 0, so the backend's
// calculation would produce capacity 0, making the shift unbookable. `capacity` is
// sent explicitly instead as a direct volunteer-count override.
// NOT YET CONFIRMED: whether the backend actually respects an explicit `capacity`
// override rather than recalculating/ignoring it. ShiftFormModal + the
// shift-scheduling page check the saved response against what was sent and warn
// on screen if they don't match — watch for that warning the first time you save
// a non-bird shift, and report it to the backend team if it fires.
export interface ShiftPayload {
  shiftDate: string;
  timeSlot: string;
  location: string;
  birdCount: number;
  capacity?: number;
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

// Matches components.schemas.ShiftLocationDto
export interface ShiftLocation {
  skillId: number;
  locationName: string;
  locationType: string;
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
    // Surface the roster-conflict case with a clearer message than the
    // generic backend error, since this is a known business rule (a shift
    // already linked to roster assignments can't be deleted).
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
// Use this instead of the hardcoded VALID_TIME_SLOTS wherever an async call
// is acceptable, since the backend is now the source of truth for valid slots.
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

/* ============================================================
   BUSINESS RULE HELPERS
   ============================================================
   These are FRONTEND-SIDE guesses for live UI feedback (e.g. disabling a
   submit button before the request even goes out). They mirror what
   section 7 of the project notes describes, but are NOT CONFIRMED as
   backend-enforced — the backend is the actual source of truth. Do not
   rely on these alone for validation; the backend can still reject a
   payload that passes these checks.
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