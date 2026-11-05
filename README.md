# SANCCOB Frontend

The frontend of the **SANCCOB Volunteer Application and Management System**, built by ConservaTech for the Southern African Foundation for the Conservation of Coastal Birds (SANCCOB).

It contains two applications that both use the live **SANCCOB Backend API**:

| App | For | Built with | Runs on |
|---|---|---|---|
| **Admin Dashboard** (`web-app/`) | SANCCOB administrators (volunteer and intern coordinators) | Next.js, React, TypeScript, Tailwind CSS | Desktop browser, hosted on Vercel |
| **Volunteer Mobile App** (`volunteer-mobile-app/`) | Volunteers, plus trainers who sign off skills | Expo, React Native, TypeScript | iPhone (TestFlight) and Android (APK) |

---

## Table of Contents

- [Live Applications](#live-applications)
- [Test Login Details](#test-login-details)
- [Project Demo and Interactive Tour](#project-demo-and-interactive-tour)
- [Architecture](#architecture)
- [Admin Dashboard](#admin-dashboard)
- [Volunteer Mobile App](#volunteer-mobile-app)
- [Authentication](#authentication)
- [Notifications](#notifications)
- [User Experience](#user-experience)
- [Testing](#testing)
- [CI/CD and Deployment](#cicd-and-deployment)
- [Known Limitations and Planned Improvements](#known-limitations-and-planned-improvements)
- [Technology Rationale](#technology-rationale)
- [User Guides](#user-guides)

---

## Live Applications

| What | Link |
|---|---|
| Admin Dashboard | https://sanccob-admin-dashboard.vercel.app/authentication/login |
| iPhone app (TestFlight) | https://testflight.apple.com/join/SgfXfQVq |
| Android app (APK) | https://expo.dev/accounts/funimms-team/projects/volunteer-mobile-app/builds/0223c284-b743-491f-89ec-ee04d054bd76|
| Backend API | https://sanccob-backend-api-btgscudjhbcdddf8.spaincentral-01.azurewebsites.net |
| API health check | https://sanccob-backend-api-btgscudjhbcdddf8.spaincentral-01.azurewebsites.net/health |

### Installing on iPhone

1. Install **TestFlight** from the App Store.
2. Open the invitation link above on the iPhone.
3. Tap **Accept**, then **Install**.
4. Open **SANCCOB Volunteers** and allow notifications.

### Installing on Android

1. Open the APK link above on the Android phone.
2. Tap **Install**. If the phone blocks it, allow installs from this source in Settings, then try again.
3. Open **SANCCOB Volunteers** and allow notifications.

New volunteers also get both download links in their activation email.

Both builds connect to the live backend. Push notifications work on real devices.

---

## Test Login Details

These are demo accounts for markers and testers.

| Role | Where | Login |
|---|---|---|
| Administrator | Admin Dashboard | `cathy@sanccob.co.za` / `PasswordForCathy` |
| Volunteer | Mobile app → **Login as Volunteer** | `funimaps04@gmail.com` / `PasswordFor@Funi04` |
| Trainer | Mobile app → **Login as Trainer** | Staff PIN `123456` |

Each trainer has their own PIN, issued by an administrator on **Staff Training → Trainers**. The PIN above belongs to the demo trainer.

---

## Project Demo and Interactive Tour

- [Watch the SANCCOB Project Demo (YouTube)](https://youtu.be/XTRUr19LNcs)
- [View the SANCCOB Interactive Tour](https://sanccob-tour.vercel.app/#tour)

---

## Architecture

The frontend is split into two apps because staff and volunteers do different work on different devices. Neither app holds business data or business rules: both call the same ASP.NET Core API, which handles authentication, authorisation, validation and every database read and write.

```text
 ┌────────────────────────┐          ┌────────────────────────┐
 │    Admin Dashboard     │          │  Volunteer Mobile App  │
 │  Next.js on Vercel     │          │  Expo / React Native   │
 │  (desktop browser)     │          │  (iPhone / Android)    │
 └───────────┬────────────┘          └───────────┬────────────┘
             │       HTTPS + JWT bearer token      │
             └──────────────────┬──────────────────┘
                                ▼
                  ┌──────────────────────────┐
                  │   SANCCOB Backend API    │──► Azure Communication Services (email)
                  │ ASP.NET Core · Azure     │──► Expo Push Service (phone notifications)
                  └────────────┬─────────────┘
                               ▼
                  ┌──────────────────────────┐
                  │     Neon PostgreSQL      │
                  └──────────────────────────┘
```

The admin dashboard also opens a **SignalR** connection to the API for live admin notifications.

---

## Admin Dashboard

### Tech stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS v4** with a design-token system (`app/globals.css`)
- **Recharts** for report charts
- **SignalR client** for live notifications
- **Jest** and **React Testing Library** for tests
- **Vercel** for hosting

### Pages

| Page | What administrators do there |
|---|---|
| **Dashboard** | See today and this week at a glance; approve or decline change requests; update conservation figures; open the room screen |
| **Volunteer room screen** | Full-screen TV display of today's shifts (first names only), refreshed every 5 minutes |
| **Volunteers** | Search, create, edit and delete volunteers; mark attendance; handle shift-change requests |
| **Roster Management** | Generate a weekly roster from availability and skills, then assign, swap or remove volunteers, publish or delete it |
| **Shift Scheduling** | Monthly calendar of shifts; create, edit and delete shifts |
| **Vacancies** | See open spots and urgent shifts; **Notify Qualified** volunteers |
| **Staff Training** | Follow volunteers' training progress; create trainers and view or reset their PINs |
| **Reports** | Yearly hours, attendance, missed shifts, top contributors and conservation impact; export to PDF or Excel |
| **Settings** | Edit the admin's profile; choose Light, Dark or System theme |

Administrators never sign off skills. Sign-off is done by trainers in the mobile app with their own PIN.

### Design system

All colours, radii and spacing are CSS custom properties in `app/globals.css`, exposed to Tailwind through `@theme inline`. Components never use raw hex values, so light and dark mode come from the same classes. Shared primitives (cards, pill buttons, inputs, line icons, time-slot chips) live in `components/ui/`.

### Project structure

```text
web-app/
├── app/
│   ├── (admin)/            # signed-in pages: dashboard, volunteers, roster, shifts,
│   │                       # training-staff, vacancies, reports, settings
│   ├── (display)/room/     # volunteer room TV screen
│   ├── authentication/     # sign-in page
│   ├── lib/
│   │   ├── api/            # one file per API area, all using http.ts (apiFetch)
│   │   └── auth-context.tsx
│   └── globals.css         # design tokens
├── components/             # page sections, modals and components/ui primitives
├── __tests__/              # Jest test suites
└── public/                 # images
```

All API calls go through `apiFetch` (`app/lib/api/http.ts`). It adds the bearer token, turns .NET validation errors into readable messages, and signs the user out automatically on a `401`.

### Configuration

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API. Built into the app at build time, so redeploy after changing it. |

### Running locally

```bash
cd web-app
npm install
npm run dev      # http://localhost:3000
npm test         # Jest test suites
npm run lint
npm run build
```

---

## Volunteer Mobile App

### Tech stack

- **Expo** with **React Native**, **Expo Router** and **TypeScript**
- **expo-secure-store** for the login token and language choice
- **expo-notifications** for push notifications
- **i18n-js** for translations (English, Afrikaans, isiXhosa, isiZulu)
- **EAS Build**, **EAS Submit** and **EAS Update**
- **Jest** with **jest-expo** and **React Native Testing Library**

### Features

**Volunteers can:**

- activate their account with the emailed code and choose a password, with inline validation of the password rules
- log in, reset a forgotten password and log out
- see this week's shifts on Home, and all shifts under **My Shifts**
- book open shifts under **Available Shifts**
- submit weekly availability (Morning, Afternoon, Full Day)
- ask to cancel a shift, with a reason
- follow training progress by stage, and see hours and shift stats
- receive in-app and push notifications
- edit their profile and switch language (English, Afrikaans, isiXhosa, isiZulu)

**Trainers can:**

- sign in with their own staff PIN
- find a volunteer and sign off a skill. Each sign-off is recorded under the trainer's name.

### Project structure

```text
volunteer-mobile-app/
├── src/
│   ├── app/                    # screens (Expo Router)
│   │   ├── index.tsx           # welcome screen
│   │   ├── login.tsx  activate.tsx  forgot-password.tsx
│   │   ├── request-change.tsx
│   │   ├── trainer-pin.tsx  trainer-dashboard.tsx  trainer-volunteer/[volunteerId].tsx
│   │   └── (tabs)/
│   │       ├── home/           # Home, notifications
│   │       ├── bookings/       # My Shifts, Available Shifts, availability
│   │       ├── progress/       # training progress, stats
│   │       └── profile.tsx
│   ├── services/               # one module per backend area
│   ├── components/             # shared UI
│   ├── i18n/                   # LanguageProvider + locales (en, af, xh, zu)
│   ├── constants/  types/  utils/
├── __tests__/                  # Jest tests
├── app.json  eas.json  .env
```

Screens never call `fetch` directly. They call a function in `src/services`, which uses the helper in `src/utils/api.ts` to add the token, parse errors and handle expired sessions.

### Configuration

The app reads one variable from `volunteer-mobile-app/.env`:

```text
EXPO_PUBLIC_API_URL=https://sanccob-backend-api-btgscudjhbcdddf8.spaincentral-01.azurewebsites.net
```

This file is committed on purpose, because the URL is public and holds no secrets. Never add real secrets to it.

### Running locally

```bash
cd volunteer-mobile-app
npm install
npx expo start      # scan the QR code with a development build or Expo Go
npm test
npx tsc --noEmit
```

---

## Authentication

Both apps use the backend's JWT authentication.

| Action | Endpoint |
|---|---|
| Log in | `POST /api/Auth/login`: returns a token and role |
| Activate (first use) | `POST /api/Auth/activate`: email, 6-digit code, new password |
| Forgot password | `POST /api/Auth/forgot-password`: same response whether or not the email exists |
| Reset password | `POST /api/Auth/reset-password` |
| Log out | `POST /api/Auth/logout`: the token is revoked on the server |
| Trainer sign-in | `POST /api/trainers/verify-pin`: rate-limited, returns a trainer-scoped token |

**Token storage:**

- **Mobile:** the token is kept in `expo-secure-store` (iOS Keychain or Android Keystore).
- **Admin dashboard:** the token is kept in `sessionStorage` by default, or in `localStorage` if the admin ticks **Keep me signed in**.
- Trainer sessions are never restored when the app restarts, which protects shared phones.

Volunteer data always comes from `/me` endpoints. The backend identifies the user from the token, so the app never sends someone else's user ID.

---

## Notifications

- **In-app:** `GET /api/notifications`, then `PATCH /api/notifications/{id}/read` to mark one read.
- **Admin feed:** `/api/admin/notifications`, with live updates over SignalR.
- **Push:** the phone registers its Expo push token with `POST /api/notifications/push-token`.

Volunteers are notified about:

- a published roster
- open shifts they're qualified for (**Notify Qualified**)
- decisions on their change requests
- skill sign-offs

---

## User Experience

- **Feedback:** every action confirms success or explains failure. The mobile app uses toast messages; the admin uses inline messages and banners.
- **Loading, empty and error states:** every screen has them. A failed section shows its own error without breaking the rest of the page.
- **Forms:** activation shows field errors inline, and the backend's validation messages appear on the field they belong to.
- **Accessibility:** colour is never the only signal; statuses and time slots are always written out. Icon buttons have labels, and the admin has a consistent keyboard focus ring.
- **Themes:** the admin supports Light, Dark and System themes, applied before first paint.
- **Languages:** the mobile app supports four languages. The Afrikaans, isiXhosa and isiZulu translations still need review by native speakers.

---

## Testing

| App | Tests | Command | Runs in CI |
|---|---|---|---|
| Admin Dashboard | 60 tests in 15 suites | `cd web-app && npm test` | `web-ci.yml` |
| Volunteer Mobile App | 51 tests in 20 files | `cd volunteer-mobile-app && npm test` | `mobile-ci.yml` |

What the tests cover:

- **Admin:** the API helper and automatic logout, session restore, the roster matrix and its modals, the shift form, the vacancy list and Notify Qualified, notifications (including the 48-hour hiding rule), the training history modal, and date helpers.
- **Mobile:** the API helper and sessions, login and navigation (volunteer and trainer), Home, shift cards, available shifts and booking, availability, cancellation requests, training and stats, notifications, profile, the trainer dashboard, the crash screen, and time helpers.

Native modules such as secure storage are mocked, so the tests run without a phone.

---

## CI/CD and Deployment

### Admin Dashboard (`.github/workflows/web-ci.yml`)

Runs on every push and pull request to `main` that touches `web-app/`.

1. **Build and test:** `npm ci`, lint, Next.js type generation, `tsc --noEmit`, the Jest suite, then a production build.
2. **Deploy** (pushes to `main` only, and only if step 1 passes): `vercel pull`, `vercel build --prod`, `vercel deploy --prebuilt --prod`, using the `VERCEL_TOKEN` secret.

A failing test or build stops the deployment. Pull requests are checked but not deployed.

### Volunteer Mobile App (`.github/workflows/mobile-ci.yml`)

Runs on pushes and pull requests to `main` that touch `volunteer-mobile-app/`: `npm ci`, `tsc --noEmit`, then `npx jest --ci`.

Builds are a deliberate, manual step through EAS:

| Profile | Produces |
|---|---|
| `preview` | Android **APK** for direct install |
| `production` | iOS store build with an auto-incremented build number, then `eas submit` to TestFlight |

Builds can also be started on expo.dev with **Build from GitHub**, which avoids uploading the project from a laptop. JavaScript-only fixes can be shipped with `eas update`.

When a new APK is built, update the link in this README and the backend's `MobileApp__AndroidUrl` setting, so activation emails point to it.

---

## Known Limitations and Planned Improvements

### Admin Dashboard

- **No unpublish.** A published roster can be edited or deleted, but not returned to draft.
- **Token in browser storage.** Moving to an HttpOnly cookie needs a cross-origin cookie set-up between Vercel and Azure.
- **Some screens are tested only manually.** The roster assignment modals, Staff Training and Reports pages have no automated tests, and there are no end-to-end browser tests.
- **Notification expiry is front-end only.** Items older than 48 hours are hidden, not deleted.
- **Shift notes** in the side panel are not yet saved to the server.
- **Screen-reader labels** on individual roster matrix cells need improving.

### Volunteer Mobile App

- **Foreground notifications.** No banner shows when the app is open; the notification still appears in the in-app list.
- **Notification taps** open the app but don't jump to the related screen.
- **Read and cleared notification state** is stored on the phone, so it doesn't carry over to another device.
- **Trainers must sign in every time.** This is deliberate for shared phones; an opt-in "stay signed in" could suit trainers with their own phone.
- **Volunteer News and Meet the Seabirds** are built into the app, so changing them needs a new release.
- **Distribution.** TestFlight builds expire after 90 days, and Expo removes free-plan build files after about 30 days. A full launch needs App Store and Google Play listings.

---

## Technology Rationale

- **Two separate apps:** administrators need tables, reports and roster editing on a big screen. Volunteers need quick answers on a phone.
- **Next.js:** file-based routing, TypeScript support and straightforward Vercel deployment.
- **React Native with Expo:** one codebase for iPhone and Android, with managed builds, secure storage, push notifications and over-the-air updates, so the team doesn't maintain native build infrastructure.
- **TypeScript:** front-end types mirror the backend DTOs, so contract mismatches are caught at compile time.
- **Tailwind with design tokens:** one source of truth for colour and spacing, and dark mode without duplicated classes.
- **Vercel:** managed hosting for Next.js, with preview and production deployments.

---

## User Guides

Step-by-step guides for each audience are delivered with the project:

- **SANCCOB Admin Web App – User Guide**, for coordinators
- **SANCCOB Volunteer Mobile App – User Guide**, for volunteers and trainers
