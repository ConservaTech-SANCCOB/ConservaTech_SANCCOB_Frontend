const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Flip to true once the backend team confirms the dashboard stats endpoint is ready
const USE_REAL_API = false;

export interface DashboardStats {
  volunteersByAge: { age: string; count: number }[];
  totalNewRecruits: number;

  conservation: {
    totalRescued: number;
    totalReleased: number;
    percentReleased: number;
  };

  shifts: {
    totalShifts: number;
    morningCount: number;
    afternoonCount: number;
    morningPercent: number;
    afternoonPercent: number;
  };

  todaysShifts: {
    area: string;
    status: string;
    time: string;
    people: string;
  }[];

  trainingSessions: {
    name: string;
    initials: string;
    status: string;
    trainer: string;
    progress: number;
  }[];
}

export async function fetchDashboardStats(token: string | null): Promise<DashboardStats> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_URL}/dashboard/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load dashboard data");
    }

    return response.json();
  }
//----------------------------------- END OF FILE ---------------------------------//

  // --- MOCK (remove once USE_REAL_API is permanently true) ---
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    volunteersByAge: [
      { age: "18-24", count: 3 },
      { age: "25-34", count: 19 },
      { age: "35-44", count: 27 },
      { age: "45-54", count: 13 },
      { age: "55-64", count: 9 },
      { age: "65+", count: 4 },
    ],
    totalNewRecruits: 75,

    conservation: {
      totalRescued: 987,
      totalReleased: 782,
      percentReleased: 79,
    },

    shifts: {
      totalShifts: 559,
      morningCount: 324,
      afternoonCount: 235,
      morningPercent: 58,
      afternoonPercent: 42,
    },

    todaysShifts: [
      { area: "African Penguin Pen A", status: "Confirmed", time: "07:00–13:00", people: "Amahle Dlamini, Fatima Patel +1" },
      { area: "Food Preparation", status: "Pending", time: "07:00–13:00", people: "Kwame Asante" },
      { area: "Aviary 1", status: "Confirmed", time: "13:00–18:00", people: "Pieter van der Merwe, Chloe Anderson" },
      { area: "Quarantine Zone", status: "Confirmed", time: "13:00–18:00", people: "Thabo Sithole" },
      { area: "Home Pen", status: "Pending", time: "07:00–13:00", people: "James Mitchell" },
    ],

    trainingSessions: [
      { name: "Amahle Dlamini", initials: "AD", status: "In Progress", trainer: "Dr. Nadia Rousseau · Stage 2", progress: 80 },
      { name: "Pieter van der Merwe", initials: "PV", status: "In Progress", trainer: "Brandon Kleinhans · Stage 2", progress: 50 },
      { name: "Zanele Mokoena", initials: "ZM", status: "Completed", trainer: "Dr. Nadia Rousseau · Completed", progress: 100 },
      { name: "James Mitchell", initials: "JM", status: "In Progress", trainer: "Mara Visser · Stage 1", progress: 10 },
    ],
  };
}