# SANCCOB API Reference — Confirmed Working

Base URL (live): `https://sanccob-backend-api-btgscudjhbcdddf8.spaincentral-01.azurewebsites.net`

Every endpoint below except Login and Activate requires an:

```text
Authorization: Bearer <token>
```

Get the token from Login or Activate first, then attach it to all protected requests.

---

# Authentication Endpoints

## POST /api/auth/activate

First-time account setup — email, PIN, and new password all in one request.

### Request

```json
{
  "email": "volunteer@example.com",
  "otp": "123456",
  "newPassword": "theirNewPassword"
}
```

### Response — 200 OK

```json
{
  "token": "eyJhbGc...",
  "role": "Volunteer"
}
```

Store the `token` securely.

- Mobile: use SecureStore.
- Dashboard: store in memory.

Activation logs the user straight in, so no separate login is required immediately afterwards.

---

## POST /api/auth/login

### Request

```json
{
  "email": "volunteer@example.com",
  "password": "theirPassword"
}
```

### Response — 200 OK

```json
{
  "token": "eyJhbGc...",
  "role": "Volunteer"
}
```

---

# Volunteer Availability Endpoints

## GET /api/volunteers/me/availability

Returns the logged-in volunteer's current availability.

No request body.

### Response — 200 OK

```json
[
  {
    "dayOfWeek": "Tuesday",
    "timeSlot": "Morning"
  }
]
```

A volunteer who has not set availability yet receives:

```json
[]
```

An empty array is not an error.

---

## PUT /api/volunteers/me/availability

Replaces the volunteer's entire availability.

Always send the full current grid state, not only the slots that changed.

### Request

```json
{
  "slots": [
    {
      "dayOfWeek": "Tuesday",
      "timeSlot": "Morning"
    },
    {
      "dayOfWeek": "Thursday",
      "timeSlot": "Afternoon"
    }
  ]
}
```

### Response — 204 No Content

There is no response body on success.

### Valid Availability Values

Valid `dayOfWeek` values:

- `Monday`
- `Tuesday`
- `Wednesday`
- `Thursday`
- `Friday`
- `Saturday`
- `Sunday`

Valid `timeSlot` values:

- `Morning`
- `Afternoon`

The API rejects values outside these options.

---

# Shift Endpoints

All Shift endpoints require:

```text
Authorization: Bearer <token>
```

---

## GET /api/shifts

Returns all shifts.

### Response — 200 OK

```json
[
  {
    "shiftId": 1,
    "shiftDate": "2026-09-07",
    "timeSlot": "08:00-13:00",
    "location": "ICU",
    "birdCount": 30,
    "capacity": 2,
    "requiredSkillIds": []
  }
]
```

---

## GET /api/shifts/{id}

Returns a single shift by its ID.

### Example

```text
GET /api/shifts/1
```

### Response — 200 OK

```json
{
  "shiftId": 1,
  "shiftDate": "2026-09-07",
  "timeSlot": "08:00-13:00",
  "location": "ICU",
  "birdCount": 30,
  "capacity": 2,
  "requiredSkillIds": []
}
```

### Possible Errors

`404 Not Found` if the shift does not exist.

---

## POST /api/shifts

Creates a new shift.

The frontend does **not** send `capacity`.

The backend calculates capacity automatically using the bird count.

### Request

```json
{
  "shiftDate": "2026-09-07",
  "timeSlot": "08:00-13:00",
  "location": "ICU",
  "birdCount": 25,
  "requiredSkillIds": []
}
```

### Response — 201 Created

Example response:

```json
{
  "shiftId": 1,
  "shiftDate": "2026-09-07",
  "timeSlot": "08:00-13:00",
  "location": "ICU",
  "birdCount": 25,
  "capacity": 1,
  "requiredSkillIds": []
}
```

### Valid Shift Time Slots

Only the following time slots are accepted:

- `08:00-13:00`
- `14:00-17:00`
- `08:00-17:00`

### Shift Validation Rules

- `birdCount` cannot be negative.
- `birdCount` cannot exceed `30`.
- Only the valid shift time slots above are accepted.
- `requiredSkillIds` must be an array.
- Every supplied Skill ID must exist.
- No required skills should be sent as `"requiredSkillIds": []`.
- Capacity is calculated by the backend.
- Capacity is based on 1 volunteer per 25 birds, rounded upward.

Examples:

| Bird Count | Capacity |
|---:|---:|
| 0 | 0 |
| 1 | 1 |
| 25 | 1 |
| 26 | 2 |
| 30 | 2 |

Invalid shift data returns:

```text
400 Bad Request
```

---

## PUT /api/shifts/{id}

Updates an existing shift.

Capacity is automatically recalculated when the bird count changes.

### Example

```text
PUT /api/shifts/1
```

### Request

```json
{
  "shiftDate": "2026-09-07",
  "timeSlot": "08:00-13:00",
  "location": "ICU",
  "birdCount": 30,
  "requiredSkillIds": []
}
```

### Response — 200 OK

Example:

```json
{
  "shiftId": 1,
  "shiftDate": "2026-09-07",
  "timeSlot": "08:00-13:00",
  "location": "ICU",
  "birdCount": 30,
  "capacity": 2,
  "requiredSkillIds": []
}
```

### Possible Errors

- `400 Bad Request` — invalid shift data.
- `404 Not Found` — shift does not exist.

---

## DELETE /api/shifts/{id}

Deletes an existing shift.

### Example

```text
DELETE /api/shifts/1
```

### Response — 204 No Content

No response body is returned after successful deletion.

### Possible Errors

- `404 Not Found` — shift does not exist.
- `409 Conflict` — shift cannot be deleted because it is already being used by roster assignments.

---

## GET /api/shifts/week

Returns shifts within a seven-day period beginning on `weekStartDate`.

### Example

```text
GET /api/shifts/week?weekStartDate=2026-09-07
```

This returns shifts from:

```text
2026-09-07 through 2026-09-13
```

### Response — 200 OK

```json
[
  {
    "shiftId": 1,
    "shiftDate": "2026-09-07",
    "timeSlot": "08:00-13:00",
    "location": "ICU",
    "birdCount": 30,
    "capacity": 2,
    "requiredSkillIds": []
  }
]
```

---

## GET /api/shifts/location/{location}

Returns shifts for a specific location.

### Example

```text
GET /api/shifts/location/ICU
```

### Response — 200 OK

```json
[
  {
    "shiftId": 1,
    "shiftDate": "2026-09-07",
    "timeSlot": "08:00-13:00",
    "location": "ICU",
    "birdCount": 30,
    "capacity": 2,
    "requiredSkillIds": []
  }
]
```

---

# Vacancy Endpoints

Vacancies are calculated from Shift and Roster Assignment data.

A Vacancy is **not** a separate database record.

Therefore there are no:

```text
POST /api/vacancies
PUT /api/vacancies
DELETE /api/vacancies
```

All Vacancy endpoints require:

```text
Authorization: Bearer <token>
```

---

## GET /api/vacancies

Returns all shifts that currently have available volunteer capacity.

### Response — 200 OK

```json
[
  {
    "shiftId": 1,
    "shiftDate": "2026-09-07",
    "timeSlot": "08:00-13:00",
    "location": "ICU",
    "birdCount": 30,
    "capacity": 2,
    "assignedVolunteers": 0,
    "vacanciesAvailable": 2,
    "requiredSkillIds": []
  }
]
```

Vacancies are calculated as:

```text
vacanciesAvailable = capacity - assignedVolunteers
```

A shift with no remaining capacity is not returned as an available vacancy.

---

## GET /api/vacancies/{shiftId}

Returns vacancy information for a specific shift.

### Example

```text
GET /api/vacancies/1
```

### Response — 200 OK

```json
{
  "shiftId": 1,
  "shiftDate": "2026-09-07",
  "timeSlot": "08:00-13:00",
  "location": "ICU",
  "birdCount": 30,
  "capacity": 2,
  "assignedVolunteers": 0,
  "vacanciesAvailable": 2,
  "requiredSkillIds": []
}
```

### Possible Errors

`404 Not Found` when no vacancy is found for the specified shift.

---

## GET /api/vacancies/week

Returns available vacancies during a seven-day period.

### Example

```text
GET /api/vacancies/week?weekStartDate=2026-09-07
```

This checks:

```text
2026-09-07 through 2026-09-13
```

### Response — 200 OK

```json
[
  {
    "shiftId": 1,
    "shiftDate": "2026-09-07",
    "timeSlot": "08:00-13:00",
    "location": "ICU",
    "birdCount": 30,
    "capacity": 2,
    "assignedVolunteers": 0,
    "vacanciesAvailable": 2,
    "requiredSkillIds": []
  }
]
```

Only shifts with remaining capacity are returned.

---

## GET /api/vacancies/location/{location}

Returns available vacancies for a specific location.

### Example

```text
GET /api/vacancies/location/ICU
```

### Response — 200 OK

```json
[
  {
    "shiftId": 1,
    "shiftDate": "2026-09-07",
    "timeSlot": "08:00-13:00",
    "location": "ICU",
    "birdCount": 30,
    "capacity": 2,
    "assignedVolunteers": 0,
    "vacanciesAvailable": 2,
    "requiredSkillIds": []
  }
]
```

Only shifts with remaining capacity at the requested location are returned.

---

# Confirmed Shift Test Data

The following shift was successfully used during API testing:

```json
{
  "shiftId": 1,
  "shiftDate": "2026-09-07",
  "timeSlot": "08:00-13:00",
  "location": "ICU",
  "birdCount": 30,
  "capacity": 2,
  "requiredSkillIds": []
}
```

The following invalid conditions have also been tested successfully:

- Bird count above 30 is rejected.
- Negative bird count is rejected.
- Invalid shift time slots are rejected.
- Valid shifts can be created.
- Existing shifts can be retrieved.
- Existing shifts can be updated.
- Capacity recalculates when bird count changes.
- Shifts can be filtered by week.
- Shifts can be filtered by location.
- Vacancies can be retrieved.
- Vacancies can be retrieved by Shift ID.
- Vacancies can be filtered by week.
- Vacancies can be filtered by location.

---

> This API reference will grow as additional backend sections are completed. Check this file before assuming an endpoint is not yet available.
