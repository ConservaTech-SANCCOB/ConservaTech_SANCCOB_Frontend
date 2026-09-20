import { api } from "../utils/api";

export interface Trainer {
  trainerId: number;
  firstName: string | null;
  lastName: string | null;
}

export function getTrainers() {
  return api.get<Trainer[]>("/api/trainers");
}

/** Throws if the PIN is wrong (or, per confirmed live behavior, if no PIN has
 * been configured server-side yet — a 500 with {"message": "..."}). The thrown
 * Error's message is that backend message when present, so callers can show
 * it directly instead of guessing "incorrect PIN" for every failure.
 * Uses skipSessionRedirect so a bad PIN (if it ever comes back as a 401)
 * doesn't get treated as an expired login session and force a log-out. */
export async function verifyTrainerPin(pin: string) {
  try {
    await api.post<void>("/api/trainers/verify-pin", { pin }, { skipSessionRedirect: true });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    const jsonStart = raw.indexOf("{");
    let backendMessage: string | null = null;
    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(raw.slice(jsonStart));
        if (typeof parsed.message === "string") backendMessage = parsed.message;
      } catch {
        // body wasn't valid JSON — leave backendMessage null and fall through
      }
    }
    throw backendMessage ? new Error(backendMessage) : error;
  }
}
