import { api, saveToken } from "../utils/api";

interface AuthResponse {
  token: string;
  role: string;
}

export async function activate(email: string, otp: string, newPassword: string) {
  const result = await api.post<AuthResponse>(
    "/api/auth/activate",
    { email, otp, newPassword },
    { skipSessionRedirect: true }
  );
  await saveToken(result.token);
  return result;
}

export async function login(email: string, password: string) {
  const result = await api.post<AuthResponse>(
    "/api/auth/login",
    { email, password },
    { skipSessionRedirect: true }
  );
  await saveToken(result.token);
  return result;
}

export function forgotPassword(email: string) {
  return api.post<void>("/api/auth/forgot-password", { email }, { skipSessionRedirect: true });
}

export async function resetPassword(email: string, resetToken: string, newPassword: string) {
  const result = await api.post<AuthResponse>(
    "/api/auth/reset-password",
    { email, resetToken, newPassword },
    { skipSessionRedirect: true }
  );
  await saveToken(result.token);
  return result;
}