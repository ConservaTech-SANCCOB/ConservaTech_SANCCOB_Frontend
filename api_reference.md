# SANCCOB API Reference — Confirmed Working

Base URL (live): `https://sanccob-backend-api-btgscudjhbcdddf8.spaincentral-01.azurewebsites.net`

Every endpoint below except Login, Activate, Forgot Password, and Reset Password requires an `Authorization: Bearer <token>` header — get the token from Login/Activate first, then attach it to everything else.

---

# Authentication

## POST /api/auth/activate

First-time account setup — email, PIN, and new password all in one request.

**Request:**
```json
{
  "email": "volunteer@example.com",
  "otp": "123456",
  "newPassword": "theirNewPassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "role": "Volunteer"
}
```

`newPassword` must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number — returns `400` otherwise. Store the `token` securely (SecureStore on mobile, in-memory on the dashboard) — this logs them straight in, no separate login step needed.

---

## POST /api/auth/login

**Request:**
```json
{
  "email": "volunteer@example.com",
  "password": "theirPassword"
}
```

**Response:** identical shape to Activate above.

---

## POST /api/auth/forgot-password

**Request:**
```json
{ "email": "volunteer@example.com" }
```

**Response (200):**
```json
{ "message": "If an account exists with this email, a reset code has been sent." }
```

Deliberately the same message whether or not the email is real — never reveals which emails have accounts. If it's real and activated, a real code gets emailed, valid for 1 hour.

---

## POST /api/auth/reset-password

**Request:**
```json
{
  "email": "volunteer@example.com",
  "resetToken": "123456",
  "newPassword": "theirNewPassword"
}
```

**Response:** identical token/role shape as Login. Same password complexity rule as Activate applies.

---

## POST /api/auth/logout

Revokes the current token server-side — it can never be used again, even though it hasn't naturally expired yet.

No request body. **Response (200):** `{ "message": "Logged out." }`

---

# Volunteer — Own Profile & Availability

## GET / PUT /api/volunteers/me/profile

**GET response (200):**
```json
{
  "firstName": "Amahle",
  "lastName": "Dlamini",
  "email": "a.dlamini@gmail.com",
  "phoneNumber": "+27712345678",
  "nationality": "South African",
  "ageBracket": "26-35",
  "emergencyContactName": "Thabo Dlamini",
  "emergencyContactPhone": "+27821234567"
}
```

**PUT request:** same shape, minus `firstName`/`lastName` (read-only for volunteers themselves — only Admin can change those, via the admin endpoints below). `email` is editable here but must stay unique. `ageBracket` is validated against the six fixed brackets (see below) — `400` on anything else. **Response:** `204 No Content`.

---

## GET /api/volunteers/me/availability

**Response (200):**
```json
[
  { "dayOfWeek": "Tuesday", "timeSlot": "08:00-13:00" }
]
```
Empty array `[]` if nothing's set yet.

## PUT /api/volunteers/me/availability

Full replace, not a merge — always send the complete current set.

**Request:**
```json
{
  "slots": [
    { "dayOfWeek": "Tuesday", "timeSlot": "08:00-13:00" },
    { "dayOfWeek": "Saturday", "timeSlot": "14:00-17:00" }
  ]
}
```
**Response:** `204 No Content`.

**Valid values (rejected otherwise):**
- `dayOfWeek`: `"Monday"` through `"Sunday"`, full name, capitalized — all seven days valid, this is genuinely a weekly grid, not Mon–Fri
- `timeSlot`: exactly `"08:00-13:00"`, `"14:00-17:00"`, or `"08:00-17:00"`

---

## GET /api/volunteers/me/shifts

**Response (200):**
```json
[
  {
    "rosterAssignmentId": 1,
    "status": "Assigned",
    "shiftId": 4,
    "shiftDate": "2026-09-05",
    "timeSlot": "08:00-13:00",
    "location": "Aviary 1",
    "isPast": false
  }
]
```
`Vacant`-status assignments (cancelled and approved) are automatically excluded — only real, current shifts show here. `isPast` is computed server-side; prefer it over comparing dates yourself.

---

## GET /api/volunteers/me/training/stats

Hours and completed-shifts summary, for the "Hours & Shifts" screen.

**Response (200):**
```json
{
  "totalHours": 42.0,
  "shiftsCompleted": 9,
  "hoursThisMonth": 8.0,
  "completedShifts": [
    { "shiftDate": "2026-09-20", "timeSlot": "08:00-13:00", "location": "Aviary 1", "hoursWorked": 5.0 }
  ]
}
```

## GET /api/volunteers/me/training/profile

Skills progress — the round percentage tracker plus category breakdowns.

**Response (200):**
```json
{
  "userId": 9,
  "firstName": "Amahle",
  "lastName": "Dlamini",
  "completedRequiredSkills": 4,
  "totalRequiredSkills": 6,
  "progressPercentage": 66.67,
  "trainingStatus": "ActivelyTraining",
  "supportingAreas": [
    { "skillId": 1, "skillName": "...", "category": "...", "isSignedOff": true, "trainerId": 2, "trainerName": "Nadia Rousseau", "signedOffAt": "2026-09-10T..." }
  ],
  "penRoutines": [ ... ],
  "seasonalSkills": [ ... ]
}
```
⚠️ `SkillCategory` values are currently under review with Max — real seeded skills use location names (`"Pen A"`, `"Quarantine"`), not the `"Supporting Areas"`/`"Pen Routines"` labels this endpoint's grouping logic expects. `trainingStatus`/category grouping may not reflect real data correctly until that's resolved.

---

# Change Requests

## POST /api/change-requests

**Volunteer only.** Requests cancellation of one of the caller's own shift assignments — ownership is checked server-side, never trust a client-supplied ID.

**Request:**
```json
{ "rosterAssignmentId": 12, "reason": "Family emergency" }
```
**Response (200):** `{ "message": "Change request submitted." }`. `409` if the assignment isn't currently `Assigned` (e.g. already cancelled).

## GET /api/change-requests/pending

**Admin only.** Every pending request, with volunteer name and shift details attached.

## GET /api/change-requests/me

**Volunteer only.** The caller's own requests, every status, most recent first.

## PUT /api/change-requests/{id}/approve

**Admin only.** Marks the assignment `Vacant` (preserved for history, not deleted) — this is what reopens the vacancy for someone else to book.

## PUT /api/change-requests/{id}/decline

**Admin only.** The assignment is left completely untouched — the volunteer keeps their shift.

---

# Vacancies — Read-Only (Max's, admin-facing)

A "vacancy" is purely computed — any shift where `Capacity > active assignment count` (`Vacant`-status assignments correctly excluded). Nothing here books anything; that's the separate endpoint below.

## GET /api/vacancies — every open vacancy
## GET /api/vacancies/{shiftId} — one specific shift's vacancy detail, `404` if it's not actually open
## GET /api/vacancies/week?weekStartDate=2026-09-22 — open vacancies in one week
## GET /api/vacancies/location/{location} — open vacancies at one location

**Response shape (all four):**
```json
{
  "shiftId": 4, "shiftDate": "2026-09-25", "timeSlot": "08:00-13:00",
  "location": "Aviary 1", "birdCount": 15, "capacity": 3,
  "assignedVolunteers": 2, "vacanciesAvailable": 1,
  "requiredSkillIds": [1, 2]
}
```

---

# Vacancy Booking

## POST /api/vacancies/{shiftId}/book

**Volunteer only.** Books an open vacancy — re-checks the vacancy is genuinely still available (race-condition guard), checks the volunteer is `SignedOff` on every skill the shift requires, and checks the 40hr/week, 5-day/week, and 4-consecutive-day limits, all before creating the assignment.

No request body — `shiftId` is in the URL. **Response (200):**
```json
{ "rosterAssignmentId": 15, "shiftId": 4, "status": "Assigned", "message": "Shift booked successfully." }
```
`409` with a specific message for whichever rule failed (no vacancy / missing skill / over an hour or day limit).

---

# Admin — Volunteer Management

## GET /api/admin/volunteers

List for the Volunteer Management table — includes live `weeklyHours` and `attendanceRate` (%), both computed from real Attendance data.

## GET /api/admin/volunteers/{id}

Full detail — everything the list has, plus `nationality`, `ageBracket`, emergency contact fields.

## POST /api/admin/volunteers

Creates a volunteer, generates an OTP, sends the real activation email.

**Request:**
```json
{
  "firstName": "Amahle", "lastName": "Dlamini", "email": "a.dlamini@gmail.com",
  "phoneNumber": "+27712345678", "nationality": "South African", "ageBracket": "26-35"
}
```
`firstName`/`lastName`/`email` required; `ageBracket` validated against the six fixed brackets. `409` if the email's already in use.

## PUT /api/admin/volunteers/{id}

Unlike the volunteer's own profile edit, Admin **can** change `firstName`/`lastName` here. Same shape as Create, minus the account-creation side effects. `204` on success.

**Valid `ageBracket` values (both here and the self-service profile edit):** `"18-24"`, `"25-34"`, `"35-44"`, `"45-54"`, `"55-64"`, `"65+"`

---

# Admin — Dashboard

## GET /api/admin/dashboard/todays-overview

Today's real shifts, each marked `"Confirmed"` (fully staffed) or `"Pending"` (still short), with assigned volunteer names.

## GET / PUT /api/admin/dashboard/conservation-impact?year=2026

Admin-entered, not computed — total rescued/released, percentage derived automatically.

**PUT request:** `{ "totalRescued": 987, "totalReleased": 782 }` → returns the same shape back with `percentReleased` calculated.

## GET /api/admin/dashboard/volunteers-by-age?year=2026

Six fixed brackets, count per bracket, plus `totalNewRecruits` — "new" means `CreatedAt` falls in the given year.

## GET /api/admin/dashboard/shift-distribution?year=2026

Morning vs. Afternoon split. Full-day shifts (`"08:00-17:00"`) are deliberately excluded — they're neither, and including them would break the two percentages summing to 100%.

---

# Admin — Reports

## GET /api/admin/reports?year=2026

One aggregate response covering the whole Reports dashboard — total hours, average attendance rate, missed shifts, active volunteers (attended a shift in the last 30 days), monthly hours/attendance trends (12 months, zero-filled), shift fill rate by area, and top 5 contributors by hours. Built, never load-tested with a real call yet — worth confirming before relying on it.

⚠️ Conservation Impact is deliberately **not** part of this endpoint — it's Dashboard-only, admin-entered data, not a computed report.

---

# Trainer Flow — Shared-Device PIN + Individual Select

This is a two-step exchange, not a normal login — two different tokens, used in sequence.

## POST /api/trainers/verify-pin

Shared 6-digit PIN (config-based, not per-trainer). `AllowAnonymous`.

**Request:** `{ "pin": "123456" }` → **Response (200):** `{ "message": "...", "token": "eyJ..." }`

This token proves "trainer access" only — **not** which specific trainer. Use it to call `GET /api/trainers`, nothing else sign-off related yet.

## POST /api/trainers/{trainerId}/select

Call this the moment a trainer taps their own name from the list. Exchanges the general token for a new one carrying a real `trainerId` claim.

**Response (200):** `{ "token": "eyJ..." }` — **this** is the token every subsequent sign-off call needs.

## GET /api/trainers / GET /api/trainers/{id}

List/detail — needs the general (or trainer-specific) token, `TrainerAccess` policy.

## POST / PUT / DELETE /api/trainers

**Admin only.** `CreateTrainerDto`/`UpdateTrainerDto` are just `firstName`/`lastName` — trainers are a standalone name-only entity, not linked to a `User` account.

⚠️ `UserRole` also has a `Trainer` value, entirely separate from this — never actually used or tested. Two disconnected concepts currently, unreconciled.

---

# Training — Sign-Off (Max's, Admin/Trainer-facing)

## GET /api/training/volunteers — all volunteers + training summary
## GET /api/training/volunteers/active — not yet fully trained
## GET /api/training/volunteers/trained — fully trained
## GET /api/training/volunteers/{userId} — one volunteer's full profile
## GET /api/training/dashboard — `{ totalVolunteers, activelyTraining, trained }`

## POST /api/training/volunteers/{userId}/sign-off

**Requires the trainer-*specific* token from `/select` above** — `TrainerId` is read from the token's claim, never from the request body.

**Request:** `{ "skillId": 3 }` — that's it, no `trainerId` field anymore.

Enforces: all Supporting Areas skills must be `SignedOff` before any Pen Routine can be. `401` if no trainer's been selected yet (general token only). ⚠️ Same `SkillCategory` caveat as the training-profile endpoint above — this gate currently doesn't fire against real seeded skill data.

---

# Shifts (Max's — admin-facing)

## GET /api/shifts — all shifts
## GET /api/shifts/{id} — one shift
## GET /api/shifts/week?weekStartDate=2026-09-22 — shifts in a week
## GET /api/shifts/location/{location} — shifts at one specific location
## GET /api/shifts/locations — **the valid location list** — currently returns `[]`, see caveat below
## GET /api/shifts/time-slots — the three valid slot values + display names

## POST / PUT /api/shifts — **Admin only**

**Request:**
```json
{
  "shiftDate": "2026-09-25", "timeSlot": "08:00-13:00",
  "location": "Aviary 1", "birdCount": 15, "capacity": 3,
  "requiredSkillIds": [1, 2]
}
```
⚠️ **`location` must exactly match a real `Skill.SkillName`** categorized `"Supporting Areas"` or `"Pen Routines"` — currently **no seeded skill has either category** (real ones are `"Pen A"`, `"Pen B"`, `"Quarantine"`), so shift creation currently fails with `400 Invalid shift location` regardless of what's typed. Being resolved with Max — don't wire frontend location pickers to real data yet.

## DELETE /api/shifts/{id} — Admin only, blocked if any roster assignments exist

---

# Roster (Max's — admin-facing)

## GET /api/rosters — all rosters, newest week first
## GET /api/rosters/{id} — one roster + all its assignments
## GET /api/rosters/week/{weekStartDate} — roster for a specific week

## POST /api/rosters/generate

**Request:** `{ "weekStartDate": "2026-09-22" }` — must be a Monday. Auto-assigns volunteers to every shift that week, reusing the exact same validation as manual assignment below (skills, availability, hour/day/consecutive-day caps, quarantine rules).

## POST /api/rosters/{rosterId}/assignments — manual assignment

**Request:** `{ "shiftId": 4, "userId": 9 }` — same full validation chain as generation.

## DELETE /api/rosters/{rosterId}/assignments/{rosterAssignmentId}

⚠️ Hard delete — inconsistent with the `Vacant`-status pattern used by Change Requests. Under discussion with Max.

## PATCH /api/rosters/{rosterId}/publish

Moves a roster to `Published`. ⚠️ Doesn't currently check for a `NeedsReview` state first — a roster can go straight `Draft` → `Published`.

---

# Attendance (Max's)

## PUT /api/attendance/{rosterAssignmentId} — **Admin only.** Marks attended/not, computes real hours from the shift's time slot.
## GET /api/attendance/{rosterAssignmentId} — one record
## GET /api/attendance/date/{date} — **Admin only.** Everyone's attendance for one day
## GET /api/attendance/volunteer/{userId}/hours — ⚠️ **no role restriction currently** — any authenticated user can view any volunteer's total hours by passing their ID
## GET /api/attendance/volunteer/{userId}/weekly-hours?weekStartDate=... — **Admin only**
## GET /api/attendance/me/hours — **Volunteer only,** own hours

---

*This file reflects what's actually been built and tested as of tonight's session. Items marked ⚠️ are known, real gaps or open questions — check `dev_notes.md` for full context before assuming they're resolved.*
