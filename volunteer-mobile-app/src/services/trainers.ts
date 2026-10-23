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
  token: string;
}

interface SelectTrainerResponse {
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
}

export async function selectTrainer(trainerId: number) {
  const response = await api.post<SelectTrainerResponse>(
    `/api/trainers/${trainerId}/select`,
    {},
    { skipSessionRedirect: true },
  );
  await saveToken(response.token, "trainer");
}
