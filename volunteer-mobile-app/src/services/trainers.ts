import { api, saveToken } from "../utils/api";

export interface Trainer {
  trainerId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
}

interface VerifyPinResponse {
  message: string;
  trainerId: number;
  token: string;
}

export function getTrainers() {
  return api.get<Trainer[]>("/api/trainers/active");
}

// ------------------------------------------------------------ //

// Saves the result as a trainer session
export async function verifyTrainerPin(pin: string) {
  const response = await api.post<VerifyPinResponse>(
    "/api/trainers/verify-pin",
    { pin },
    { skipSessionRedirect: true },
  );
  await saveToken(response.token, "trainer");
  return response.trainerId;
}
