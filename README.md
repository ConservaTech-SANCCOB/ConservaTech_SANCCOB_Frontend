# SANCCOB Frontend

The SANCCOB frontend consists of two separate applications, both consuming the [SANCCOB Backend API](https://sanccob-backend-api-btgscudjhbcdddf8.spaincentral-01.azurewebsites.net):

- **Admin Dashboard** (Next.js, web) — used by SANCCOB staff (admins/trainers) to manage volunteers, rosters, shifts, training, and vacancies.
- **Volunteer Mobile App** (Expo, iOS/Android/Web) — used by volunteers to log in, set availability, view assigned shifts, request shift changes, and track training progress.

Staff use the dashboard; volunteers use the mobile app. Staff login is not yet supported in the mobile app ("Coming Soon" on its welcome screen).

## Shared: Backend API

Both apps authenticate against `POST /api/auth/login` (or `/api/auth/activate` for first-time setup) and attach the returned JWT to every subsequent request:
```
Authorization: Bearer <token>
```
See the team's `api_reference.md` for full endpoint documentation (Auth, Shifts, Vacancies, Volunteer Availability, Notifications, etc.).

---

## Admin Dashboard (Next.js)

### Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Recharts** for charts/reports

### Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:
```bash
npm run build   # production build
npm run start   # run a production build
npm run lint    # eslint
```

### Project Structure

- `app/` — routes (App Router)
- Sidebar navigation currently covers: Dashboard, Volunteers, Roster Management, Shift Scheduling, Staff Training, Vacancies, Reports, Settings
- Shared layout components (sidebar, topbar) live alongside the pages that use them

### Status

This dashboard is under active development. The sidebar and topbar shell are in place; individual feature pages (Volunteers, Roster Management, etc.) are being built out. As pages are wired up to the real API, update this section with any data-fetching conventions the team settles on (e.g. a shared `api.ts` client, where the auth token is stored for the web app, etc.).

### Deployment

Intended for deployment to Vercel (standard for Next.js) or wherever the team decides — update this once a deployment target is chosen.

---

## Volunteer Mobile App (Expo)

### Tech Stack

- **Expo SDK 57** / React Native
- **Expo Router** (file-based routing)
- **React 19** / TypeScript
- **expo-secure-store** for storing the auth token

### Getting Started

```bash
npm install
npx expo start
```

From the Expo CLI output you can open the app in a development build, Android emulator, iOS simulator, or Expo Go.

Other scripts:
```bash
npm run android   # expo start --android
npm run ios       # expo start --ios
npm run web       # expo start --web
npm run lint      # expo lint
```

### API Integration

All API calls go through `utils/api.ts`, which points at the live backend URL. The JWT returned by login/activate is stored via `expo-secure-store` (`saveToken`/`getToken`/`clearToken`) and automatically attached as `Authorization: Bearer <token>` on every request.

### App Structure

```
app/
├── index.tsx              # Welcome screen (Login / Activate / Staff login [coming soon])
├── login.tsx               # Volunteer login
├── activate.tsx             # First-time account activation (email + PIN + new password)
└── (tabs)/
    ├── home.tsx             # This week's shifts + notifications
    ├── bookings/
    │   ├── index.tsx        # My Shifts / Available Shifts
    │   ├── submit-availability.tsx
    │   └── request-change.tsx
    ├── progress/            # Training tab
    └── profile.tsx          # Profile details, change password, log out

services/                   # API calls (auth.ts, shifts.ts, availability.ts)
utils/                      # api.ts (fetch wrapper + token storage), colors.ts
components/                 # BookingCard, NotificationsDropdown, StatusBadge
types/                      # Shared TypeScript interfaces
data/                       # Mock data used before an endpoint exists
```

### Current Integration Status

Some screens are already wired to the real API (login, activate, submit availability, my/available shifts). A few are still using mock/placeholder data or have explicit TODOs marking where a real endpoint is needed once it exists:

- `home.tsx` — the shifts list uses `mockBookings` (currently empty) rather than a real endpoint; has a `TODO: replace with real API calls once bookings/notifications endpoints exist`.
- `NotificationsDropdown.tsx` — static empty state only, not yet calling `GET /api/notifications`.
- `request-change.tsx` — the submit action is a fake delay (`TODO: replace with real POST once a shift-change-request endpoint exists`); there's no shift-change-request endpoint on the backend yet either.
- `progress` tab (training/skills) — `mockSkills.ts` has a hardcoded skill list rather than pulling from the backend's Skill/VolunteerSkillProgress data.

**Worth double-checking:** `submit-availability.tsx` offers volunteers the shift time slots (`08:00-13:00`, `14:00-17:00`, `08:00-17:00`) as availability options, but the backend's availability endpoint documentation (`api_reference.md`) says it only accepts `Morning` / `Afternoon` for `timeSlot`. If that's still accurate, submitting availability from this screen as-is would get rejected with a 400 — worth confirming with whoever owns the availability endpoint before this ships.

### Known Placeholders

- Profile screen: full name field is read-only and currently always empty — not yet pulling the logged-in user's actual name from the backend.
- Password change form on the profile screen isn't wired to an endpoint yet.
- "Forgot your password?" and "Login as Staff" are both explicit "Coming Soon" alerts.
