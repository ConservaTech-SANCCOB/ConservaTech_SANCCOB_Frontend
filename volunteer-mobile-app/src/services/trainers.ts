import { api, saveToken } from "../utils/api";

export interface Trainer {
  trainerId: number;
  firstName: string | null;
  lastName: string | null;
}

interface VerifyPinResponse {
  message: string;
  token: string;
}

interface SelectTrainerResponse {
  token: string;
}

export function getTrainers() {
  return api.get<Trainer[]>("/api/trainers");
}

export async function verifyTrainerPin(pin: string) {
  try {
    const response = await api.post<VerifyPinResponse>(
      "/api/trainers/verify-pin",
      { pin },
      { skipSessionRedirect: true },
    );
    await saveToken(response.token);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    const jsonStart = raw.indexOf("{");
    let backendMessage: string | null = null;
    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(raw.slice(jsonStart));
        if (typeof parsed.message === "string") backendMessage = parsed.message;
      } catch {}
    }
    throw backendMessage ? new Error(backendMessage) : error;
  }
}

export async function selectTrainer(trainerId: number) {
  const response = await api.post<SelectTrainerResponse>(
    `/api/trainers/${trainerId}/select`,
    {},
    { skipSessionRedirect: true },
  );
  await saveToken(response.token);
}
