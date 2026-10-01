import { api, ApiError, saveToken } from "../utils/api";

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

// ------------------------------------------------------------ //

// Saves the result as a trainer session
export async function verifyTrainerPin(pin: string) {
  try {
    const response = await api.post<VerifyPinResponse>(
      "/api/trainers/verify-pin",
      { pin },
      { skipSessionRedirect: true },
    );
    await saveToken(response.token, "trainer");
  } catch (error) {
    // Show the backend message not raw API error text
    throw error instanceof ApiError && error.backendMessage ? new Error(error.backendMessage) : error;
  }
}

export async function selectTrainer(trainerId: number) {
  const response = await api.post<SelectTrainerResponse>(
    `/api/trainers/${trainerId}/select`,
    {},
    { skipSessionRedirect: true },
  );
  await saveToken(response.token, "trainer");
}
