import { api, ApiError, getErrorStatus } from "../utils/api";

export interface Vacancy {
  shiftId: number;
  shiftDate: string;
  timeSlot: string;
  location: string | null;
  birdCount: number;
  capacity: number;
  assignedVolunteers: number;
  vacanciesAvailable: number;
  requiredSkillIds: number[];
}

export function getVacancies() {
  return api.get<Vacancy[]>("/api/vacancies");
}

// ------------------------------------------------------------ //

export interface BookVacancyResponse {
  rosterAssignmentId: number;
  shiftId: number;
  status: string | null;
  message: string | null;
}

// Backend refused the booking on purpose
export class BookingRejectedError extends Error {
  backendMessage: string | null;
  constructor(backendMessage: string | null) {
    super(backendMessage ?? "Booking rejected");
    this.name = "BookingRejectedError";
    this.backendMessage = backendMessage;
  }
}

// ------------------------------------------------------------ //

export async function bookVacancy(shiftId: number) {
  try {
    return await api.post<BookVacancyResponse>(`/api/vacancies/${shiftId}/book`, {});
  } catch (error) {
    const status = getErrorStatus(error);
    // A deliberate refusal not a crash
    if (status === 400 || status === 404 || status === 409) {
      throw new BookingRejectedError(error instanceof ApiError ? error.backendMessage : null);
    }
    throw error;
  }
}

//----------------------------------- END OF FILE ---------------------------------//
