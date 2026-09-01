# SANCCOB API Reference — Confirmed Working

Base URL (live): `https://sanccob-backend-api-btgscudjhbcdddf8.spaincentral-01.azurewebsites.net`

Every endpoint below except Login and Activate requires an `Authorization: Bearer <token>` header — get the token from Login or Activate first, then attach it to everything else.

---

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

Store the `token` securely (SecureStore on mobile, in-memory on the dashboard) — this logs them straight in, no separate login step needed right after.

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

## GET /api/volunteers/me/availability

No request body. Returns the logged-in volunteer's current availability.

**Response (200):**
```json
[
  { "dayOfWeek": "Tuesday", "timeSlot": "Morning" }
]
```

Empty array `[]` for a volunteer who hasn't set anything yet — not an error.

---

## PUT /api/volunteers/me/availability

Replaces the volunteer's entire availability with whatever's sent — always send the full current grid state, not just what changed.

**Request:**
```json
{
  "slots": [
    { "dayOfWeek": "Tuesday", "timeSlot": "Morning" },
    { "dayOfWeek": "Thursday", "timeSlot": "Afternoon" }
  ]
}
```

**Response:** `204 No Content` on success — no body, just confirm the status code.

---

## Valid values, since nothing in the database enforces these — the API will reject anything else

- `dayOfWeek`: `"Monday"` through `"Sunday"`, full name, capitalized
- `timeSlot`: `"Morning"` or `"Afternoon"` only

---

*This file will grow as more endpoints get built — check back before assuming something isn't available yet.*
