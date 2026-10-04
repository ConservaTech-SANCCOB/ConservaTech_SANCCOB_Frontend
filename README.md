# SANCCOB Frontend

The SANCCOB frontend consists of two separate applications that both consume the live **SANCCOB Backend API**:

- **Admin Dashboard** — a desktop-focused web application used by SANCCOB administrators and trainers.
- **Volunteer Mobile App** — a mobile application used by volunteers to manage availability, shifts, training, profile information, and notifications.

Both applications are fully integrated with the backend and use authenticated API requests for their core functionality.

Backend API:

```text
https://sanccob-backend-api-btgscudjhbcdddf8.spaincentral-01.azurewebsites.net
```

---

# Live Applications

## Admin Dashboard

The live SANCCOB Admin Dashboard is deployed on **Vercel**:

```text
https://sanccob-admin-dashboard.vercel.app/authentication/login
```

The dashboard is intended for SANCCOB administrators and trainers and is designed primarily for desktop use.

## Volunteer Mobile App

The SANCCOB Volunteer Mobile App is currently distributed for iOS testing through **Apple TestFlight**:

```text
https://testflight.apple.com/join/SgfXfQVq
```

To install the test build:

1. Install the **TestFlight** app from the Apple App Store.
2. Open the SANCCOB TestFlight invitation link.
3. Accept the invitation.
4. Install the SANCCOB Volunteer application.
5. Open the installed application from your device.

The TestFlight build connects to the live backend and supports the current mobile functionality, including push notifications.

---

## Table of Contents

- [Live Applications](#live-applications)
- [Frontend Architecture](#frontend-architecture)
- [Shared Backend Integration](#shared-backend-integration)
- [Admin Dashboard](#admin-dashboard)
- [Volunteer Mobile App](#volunteer-mobile-app)
- [Authentication](#authentication)
- [Notifications](#notifications)
- [User Experience and Feedback](#user-experience-and-feedback)
- [Testing](#testing)
- [Deployment](#deployment)
- [Technology Rationale](#technology-rationale)

---

# Frontend Architecture

The frontend is split into two applications because SANCCOB staff and volunteers have different workflows and device requirements.

```text
                 ┌─────────────────────────────┐
                 │      Admin Dashboard        │
                 │    Next.js / React Web      │
                 │       Desktop-focused       │
                 └──────────────┬──────────────┘
                                │
                                │ HTTPS / JWT
                                │
                                ▼
                    ┌───────────────────────┐
                    │  SANCCOB Backend API  │
                    │ ASP.NET Core / Azure  │
                    └───────────┬───────────┘
                                │
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Neon PostgreSQL     │
                    └───────────────────────┘
                                ▲
                                │
                                │ HTTPS / JWT
                 ┌──────────────┴──────────────┐
                 │    Volunteer Mobile App     │
                 │   Expo / React Native       │
                 │      iOS / Android          │
                 └─────────────────────────────┘
```

The separation allows each interface to be designed specifically for its intended users.

The admin dashboard prioritises information density, administrative workflows, reports, roster management, and desktop usability.

The volunteer mobile application prioritises quick access to personal shifts, availability, training progress, profile information, and notifications.

---

# Shared Backend Integration

Both frontend applications communicate with the same ASP.NET Core backend.

Authentication is performed through the backend API and authenticated requests include a JWT:

```http
Authorization: Bearer <token>
```

Core backend functionality used by the frontend includes:

- authentication;
- account activation;
- password recovery;
- volunteer profiles;
- availability;
- shifts;
- roster information;
- vacancy booking;
- attendance;
- change requests;
- training;
- notifications;
- reporting;
- administrative dashboard data.

The backend remains responsible for business rules, authorization, database access, and validation, while the frontend focuses on presentation and user interaction.

---

# Admin Dashboard

The **SANCCOB Admin Dashboard** is a desktop-focused web application for SANCCOB administrators and trainers.

## Tech Stack

The dashboard uses:

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Recharts**
- **Fetch API**
- **Vercel** for hosting and deployment

---

## Purpose

The dashboard gives authorised SANCCOB staff access to administrative functions including:

- dashboard analytics;
- volunteer management;
- roster management;
- shift scheduling;
- training management;
- trainer functionality;
- vacancies;
- attendance information;
- notifications;
- reporting;
- conservation-impact statistics.

---

## Project Structure

The application follows the Next.js App Router structure.

A simplified structure is:

```text
web-app/
├── app/
│   ├── (admin)/
│   │   ├── vacancies/
│   │   ├── volunteers/
│   │   └── ...
│   │
│   ├── authentication/
│   │   └── ...
│   │
│   ├── lib/
│   │   └── api/
│   │       ├── auth.ts
│   │       ├── dashboard.ts
│   │       ├── http.ts
│   │       ├── notifications.ts
│   │       ├── reports.ts
│   │       ├── roster.ts
│   │       ├── shifts.ts
│   │       ├── training_staff.ts
│   │       └── volunteers.ts
│   │
│   ├── auth-context.tsx
│   ├── use-notifications.ts
│   ├── layout.tsx
│   └── page.tsx
│
├── public/
├── package.json
└── ...
```

API functionality is separated into feature-specific modules rather than being written directly inside each page.

This keeps API access reusable and makes the frontend easier to maintain.

---

## API Configuration

The dashboard reads the backend URL from:

```text
NEXT_PUBLIC_API_URL
```

For example:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

Requests are then sent to the configured backend environment.

This prevents the application from hard-coding environment-specific URLs throughout the codebase.

---

## Authentication Requests

Authentication logic is separated into API utilities.

For example, the login request sends user credentials to:

```text
POST /api/Auth/login
```

and expects the backend `AuthResponseDto` structure:

```ts
export interface LoginResponse {
  token: string | null;
  role: string | null;
}
```

The frontend verifies the backend response before treating the user as authenticated.

Failed responses are handled explicitly and converted into user-facing errors.

For example:

- `400 Bad Request`;
- `401 Unauthorized`;
- unexpected server errors.

This keeps authentication errors predictable and prevents unsuccessful API responses from being treated as valid logins.

---

## Admin Authorization

The dashboard works together with the backend's role and policy authorization.

Administrative requests are authenticated using JWTs and protected backend endpoints enforce permissions such as:

```text
Admin
```

and trainer-specific access rules.

The frontend controls the user experience, while the backend remains the authoritative security boundary.

---

## Dashboard and Reports

The dashboard retrieves live analytics from backend administrative endpoints.

Examples include:

- today's overview;
- conservation impact;
- volunteer age distribution;
- shift distribution;
- attendance statistics;
- reporting data;
- volunteer contributions.

Charts and reports are rendered using **Recharts** where visualisation is required.

---

## Desktop-Focused Design

The admin dashboard is intentionally designed primarily for **desktop use**.

Administrative workflows often require:

- viewing tables;
- managing multiple records;
- reviewing roster information;
- displaying reports and charts;
- working with larger amounts of information simultaneously.

For this reason, the desktop dashboard is treated separately from the mobile volunteer experience rather than attempting to use one interface for both audiences.

---

## Getting Started

Navigate to the web application:

```bash
cd web-app
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Other available scripts include:

```bash
npm run build
npm run start
npm run lint
```

---

# Volunteer Mobile App

The **SANCCOB Volunteer Mobile App** is built with Expo and React Native.

The mobile application is used by volunteers to manage their SANCCOB participation from their phones.

## Tech Stack

The mobile application uses:

- **Expo**
- **React Native**
- **Expo Router**
- **React 19**
- **TypeScript**
- **expo-secure-store**
- **Expo Push Notifications**
- **EAS Build**
- **EAS Submit**

---

## Main Features

The mobile application supports:

- volunteer login;
- account activation;
- forgot-password flow;
- password reset;
- viewing assigned shifts;
- viewing available shifts;
- vacancy booking;
- submitting availability;
- submitting shift-change requests;
- viewing training progress;
- viewing training statistics;
- viewing notifications;
- receiving push notifications;
- viewing profile information;
- editing profile information;
- logging out.

All current screens are connected to the live backend.

---

## App Structure

A simplified mobile application structure is:

```text
volunteer-mobile-app/
├── app/
│   ├── index.tsx
│   ├── login.tsx
│   ├── activate.tsx
│   ├── ...
│   │
│   └── (tabs)/
│       ├── home.tsx
│       │
│       ├── bookings/
│       │   ├── index.tsx
│       │   ├── submit-availability.tsx
│       │   └── request-change.tsx
│       │
│       ├── progress/
│       │   └── ...
│       │
│       └── profile.tsx
│
├── src/
│   └── services/
│       ├── auth.ts
│       ├── notifications.ts
│       ├── pushNotifications.ts
│       └── ...
│
├── components/
├── types/
├── utils/
├── app.json
└── package.json
```

The application separates:

- routes and screens;
- API service calls;
- shared components;
- TypeScript interfaces;
- authentication utilities;
- notification functionality.

---

## API Integration

The mobile application communicates directly with the live SANCCOB backend.

Authenticated API requests attach the JWT:

```http
Authorization: Bearer <token>
```

The authentication token is stored securely using:

```text
expo-secure-store
```

This is preferable to storing sensitive authentication information in ordinary local application storage.

---

## Volunteer Profile

The profile functionality is connected to the backend profile endpoints.

Volunteers can retrieve and edit their own information through authenticated API calls.

Examples include:

```text
GET /api/volunteers/me/profile
PUT /api/volunteers/me/profile
```

The `/me` pattern allows the backend to determine the user from the JWT rather than relying on the mobile application to supply an arbitrary user ID.

---

## Availability

Volunteers can submit and update their availability through the backend.

The application sends availability information for:

- day of the week;
- selected time slot.

The submitted availability is then used by backend scheduling and roster-generation logic.

---

## Shift Management

The mobile application allows volunteers to view:

- assigned shifts;
- available shifts;
- vacancy information.

Eligible volunteers can also book vacancies through the backend API.

---

## Shift Change Requests

Shift-change requests are fully integrated with the backend.

Volunteers can submit real requests through the application instead of using placeholder or mock functionality.

The backend records the request and administrators can later approve or decline it.

---

## Training Progress

The training section is connected to the backend training API.

Volunteers can view real training information including:

- training profile;
- training statistics;
- skill progress;
- signed-off skills.

This replaces the earlier mock-data implementation.

---

# Authentication

Both applications use the SANCCOB backend authentication system.

The frontend supports:

- login;
- first-time account activation;
- forgot password;
- reset password;
- logout.

## Login

Users authenticate using:

```text
POST /api/Auth/login
```

Successful authentication returns:

- JWT token;
- user role.

The token is used for future authenticated requests.

---

## Account Activation

New users activate their account using:

```text
POST /api/Auth/activate
```

The activation process uses the OTP/account activation information provided by SANCCOB.

After successful activation, the user can access authenticated features.

---

## Forgot Password

The forgot-password flow is connected to:

```text
POST /api/Auth/forgot-password
```

The backend generates the required reset information and sends it through the configured email service.

---

## Reset Password

Password reset uses:

```text
POST /api/Auth/reset-password
```

The frontend collects the required reset information and sends it to the backend for validation.

The backend remains responsible for:

- validating the reset code;
- checking expiry;
- applying password rules;
- securely hashing the new password.

---

## Logout

Logout invalidates the current authenticated session through the backend token-revocation workflow.

The frontend also clears its locally stored authentication information.

---

# Notifications

Notifications are fully integrated across the frontend and backend.

## In-App Notifications

Users can retrieve notifications from:

```text
GET /api/notifications
```

and mark notifications as read through:

```text
PATCH /api/notifications/{id}/read
```

The admin dashboard also supports its own administrative notification endpoints.

---

## Expo Push Notifications

The mobile application uses **Expo Push Notifications**.

The app registers its push token with the backend through:

```text
POST /api/notifications/push-token
```

The backend can then send relevant push notifications to the device.

Push notifications are used for events such as:

- available shifts;
- shift-change outcomes;
- completed training;
- other relevant volunteer updates.

Push notification functionality is operational in the mobile test build.

---

# User Experience and Feedback

Both frontend applications provide user feedback for actions that succeed or fail.

Examples include:

- successful form submissions;
- successful profile updates;
- authentication errors;
- API validation errors;
- failed login attempts;
- failed administrative actions;
- successful roster or shift operations.

The applications use **success and error messages** to communicate the outcome of user actions.

The current implementation does not rely on dedicated loading indicators as a standard UI pattern.

---

# Testing

Automated frontend tests are implemented as part of the frontend codebase.

Testing helps verify frontend behaviour and reduces the risk of regressions as features are changed or extended.

Testing should be run before deployment alongside normal development checks such as linting and production builds.

Where applicable, tests cover frontend logic and behaviour independently from the production backend environment.

---

# Deployment

The two frontend applications use different deployment strategies because they target different platforms.

## Admin Dashboard Deployment

The admin dashboard is deployed using **Vercel**.

The production web application communicates with the live Azure-hosted SANCCOB Backend API.

The backend API URL is configured using:

```text
NEXT_PUBLIC_API_URL
```

This keeps deployment configuration separate from the source code.

The live application link is listed in the [Live Applications](#live-applications) section at the top of this README.

---

## Volunteer Mobile App Deployment

The mobile application uses the Expo Application Services deployment toolchain.

Builds are created using:

```bash
eas build
```

and submitted using:

```bash
eas submit
```

For iOS testing, the application is distributed through **Apple TestFlight**.

The TestFlight installation link is listed in the [Live Applications](#live-applications) section at the top of this README.

---

# Technology Rationale

## Separate Web and Mobile Applications

The system uses separate staff and volunteer frontends because the two user groups have significantly different requirements.

Administrators require:

- tables;
- analytics;
- reporting;
- roster management;
- shift scheduling;
- volunteer administration;
- training management.

These tasks benefit from a larger desktop interface.

Volunteers primarily require:

- shift information;
- availability;
- notifications;
- bookings;
- training progress;
- profile management.

These workflows are suited to a mobile application that can be accessed quickly during normal volunteer activity.

---

## Next.js

Next.js was selected for the admin dashboard because it provides:

- strong React and TypeScript support;
- file-based routing through the App Router;
- component-based development;
- environment-based configuration;
- straightforward Vercel deployment.

It also supports the structured administrative pages required by the system.

---

## React Native and Expo

React Native allows the volunteer interface to use a mobile-first user experience while sharing a TypeScript/React development model with the web application.

Expo simplifies:

- development;
- native builds;
- device testing;
- secure storage;
- push notifications;
- iOS distribution;
- Android distribution.

EAS Build and EAS Submit also reduce the amount of native deployment infrastructure the team needs to manage manually.

---

## TypeScript

Both frontend applications use TypeScript.

TypeScript improves maintainability by providing static typing for:

- API response structures;
- component properties;
- application state;
- service functions;
- shared interfaces.

This is particularly useful when consuming DTO-based ASP.NET Core APIs because frontend types can closely match backend response contracts.

---

## Tailwind CSS

Tailwind CSS is used by the admin dashboard to provide reusable styling utilities and maintain consistent interface styling.

It supports the dashboard's layout, typography, spacing, forms, tables, and other visual elements.

---

## Vercel

Vercel provides managed hosting for the Next.js administration dashboard.

Using Vercel reduces deployment overhead and integrates naturally with the Next.js development model.

---

## Expo SecureStore

The volunteer application uses Expo SecureStore for sensitive authentication information.

This provides more appropriate device-level storage for authentication tokens than ordinary application storage.

---

# Summary

The SANCCOB frontend provides two purpose-built interfaces connected to the same secure backend.

The **Admin Dashboard** provides a desktop-focused interface for SANCCOB staff to manage:

- volunteers;
- shifts;
- rosters;
- training;
- vacancies;
- reports;
- notifications;
- dashboard analytics.

The **Volunteer Mobile App** provides volunteers with mobile access to:

- authentication;
- availability;
- shifts;
- bookings;
- change requests;
- training;
- notifications;
- profile management.

The frontend implementation combines:

- Next.js;
- React;
- React Native;
- Expo;
- TypeScript;
- Tailwind CSS;
- Recharts;
- Expo SecureStore;
- Expo Push Notifications;
- automated frontend testing;
- Vercel deployment;
- EAS Build and Submit;
- Apple TestFlight distribution;
- live integration with the Azure-hosted SANCCOB Backend API.

Together, the two applications provide a complete frontend layer for SANCCOB's volunteer management and scheduling system.
```
