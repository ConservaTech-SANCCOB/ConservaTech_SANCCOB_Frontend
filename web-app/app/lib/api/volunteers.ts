const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Flip to true once the backend team confirms the volunteer endpoints are ready
const USE_REAL_API = false;

export interface Volunteer {
  id: string;
  initials: string;
  name: string;
  area: string;
  email: string;
  phone: string;
  address: string;
  joinedDate: string;
  weeklyHoursLogged: number;
  maxWeeklyHours: number;
  annualHoursLogged: number;
  availability: string[];
}

export interface ShiftRequest {
  id: string;
  volunteerInitials: string;
  volunteerName: string;
  currentDate: string;
  currentTime: string;
  requestedDate: string;
  requestedTime: string;
  requestType: "Change Date/Time" | "Cancellation";
  reason: string;
  status: "Pending" | "Approved" | "Declined";
}

export async function fetchVolunteers(token: string | null): Promise<Volunteer[]> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_URL}/volunteers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load volunteer profiles");
    }

    return response.json();
  }

  // --- MOCK (remove once USE_REAL_API is permanently true) ---
  await new Promise((resolve) => setTimeout(resolve, 600));

  return [
    {
      id: "1",
      initials: "AD",
      name: "Amahle Dlamini",
      area: "African Penguin Pen A",
      email: "a.dlamini@gmail.com",
      phone: "+27 71 234 5678",
      address: "12 Ocean View Dr, Sea Point, Cape Town",
      joinedDate: "2025-03-15",
      weeklyHoursLogged: 20,
      maxWeeklyHours: 40,
      annualHoursLogged: 142,
      availability: ["Mon", "Wed", "Fri"],
    },
    {
      id: "2",
      initials: "CA",
      name: "Chloe Anderson",
      area: "NUR",
      email: "c.anderson@gmail.com",
      phone: "+27 82 109 8765",
      address: "4 Main Rd, Kalk Bay, Cape Town",
      joinedDate: "2024-11-02",
      weeklyHoursLogged: 15,
      maxWeeklyHours: 40,
      annualHoursLogged: 124,
      availability: ["Tue", "Thu", "Sat"],
    },
    {
      id: "3",
      initials: "EB",
      name: "Emma Botha",
      area: "African Penguin Pen B",
      email: "e.botha@gmail.com",
      phone: "+27 84 654 3210",
      address: "9 Beach Rd, Muizenberg, Cape Town",
      joinedDate: "2025-01-20",
      weeklyHoursLogged: 25,
      maxWeeklyHours: 40,
      annualHoursLogged: 156,
      availability: ["Tue", "Wed", "Sat", "Sun"],
    },
  ];
}

// FE-A08 addition: create a new volunteer profile
export async function createVolunteer(
  token: string | null,
  volunteer: Omit<Volunteer, "id" | "initials" | "weeklyHoursLogged" | "annualHoursLogged" | "joinedDate">
): Promise<Volunteer> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_URL}/volunteers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(volunteer),
    });

    if (!response.ok) {
      throw new Error("Failed to create volunteer");
    }

    return response.json();
  }

  // --- MOCK: generate a fake volunteer locally ---
  await new Promise((resolve) => setTimeout(resolve, 400));

  const initials = volunteer.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return {
    ...volunteer,
    id: `local-${Date.now()}`,
    initials,
    weeklyHoursLogged: 0,
    annualHoursLogged: 0,
    joinedDate: new Date().toISOString().split("T")[0],
  };
}

export async function fetchShiftRequests(token: string | null): Promise<ShiftRequest[]> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_URL}/volunteers/shift-requests`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load shift change requests");
    }

    return response.json();
  }

  // --- MOCK (remove once USE_REAL_API is permanently true) ---
  await new Promise((resolve) => setTimeout(resolve, 600));

  return [
    {
      id: "r1",
      volunteerInitials: "AD",
      volunteerName: "Amahle Dlamini",
      currentDate: "2026-08-18",
      currentTime: "07:00–13:00",
      requestedDate: "2026-08-19",
      requestedTime: "13:00–18:00",
      requestType: "Change Date/Time",
      reason: "Medical appointment...",
      status: "Pending",
    },
    {
      id: "r2",
      volunteerInitials: "ZM",
      volunteerName: "Zanele Mokoena",
      currentDate: "2026-08-17",
      currentTime: "13:00–18:00",
      requestedDate: "2026-08-17",
      requestedTime: "07:00–13:00",
      requestType: "Change Date/Time",
      reason: "Family commitment i...",
      status: "Pending",
    },
    {
      id: "r3",
      volunteerInitials: "CA",
      volunteerName: "Chloe Anderson",
      currentDate: "2026-08-20",
      currentTime: "07:00–13:00",
      requestedDate: "-",
      requestedTime: "-",
      requestType: "Cancellation",
      reason: "Out of town for work",
      status: "Approved",
    },
    {
      id: "r4",
      volunteerInitials: "PV",
      volunteerName: "Pieter van der Merwe",
      currentDate: "2026-08-16",
      currentTime: "13:00–18:00",
      requestedDate: "2026-08-23",
      requestedTime: "13:00–18:00",
      requestType: "Change Date/Time",
      reason: "Conflict with another...",
      status: "Declined",
    },
  ];
}