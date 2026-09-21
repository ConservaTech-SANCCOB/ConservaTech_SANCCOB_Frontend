import { api, getErrorStatus } from "../utils/api";

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

export interface BookVacancyResponse {
  rosterAssignmentId: number;
  shiftId: number;
  status: string | null;
  message: string | null;
}

/** Thrown when the backend rejects a booking for a reason tied to the shift itself
 * (400/404/409 — e.g. it filled up or is otherwise no longer bookable). `backendMessage`
 * is the message from the response's JSON body when there is one, else null. The spec
 * doesn't document these responses, so which status the backend uses is unconfirmed. */
export class BookingRejectedError extends Error {
  backendMessage: string | null;
  constructor(backendMessage: string | null) {
    super(backendMessage ?? "Booking rejected");
    this.name = "BookingRejectedError";
    this.backendMessage = backendMessage;
  }
}

/** Self-service booking of an open shift. POST with no request body — the shift is
 * identified only by the path param. This is in addition to auto-assignment. */
export async function bookVacancy(shiftId: number) {
  try {
    return await api.post<BookVacancyResponse>(`/api/vacancies/${shiftId}/book`, {});
  } catch (error) {
    const status = getErrorStatus(error);
    if (status === 400 || status === 404 || status === 409) {
      const raw = error instanceof Error ? error.message : "";
      const jsonStart = raw.indexOf("{");
      let backendMessage: string | null = null;
      if (jsonStart >= 0) {
        try {
          const parsed = JSON.parse(raw.slice(jsonStart));
          const text = parsed.message ?? parsed.detail;
          if (typeof text === "string" && text.trim()) backendMessage = text.trim();
        } catch {
          // body wasn't valid JSON — leave backendMessage null
        }
      }
      throw new BookingRejectedError(backendMessage);
    }
    throw error;
  }
}
