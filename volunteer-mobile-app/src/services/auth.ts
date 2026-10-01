import { api, clearToken, saveToken } from "../utils/api";
import { logError } from "../utils/logError";

interface AuthResponse {
  token: string;
  role: string;
}

// First login swaps the emailed code for a password
export async function activate(email: string, otp: string, newPassword: string) {
  const result = await api.post<AuthResponse>(
    "/api/auth/activate",
    { email, otp, newPassword },
    { skipSessionRedirect: true }
  );
  await saveToken(result.token);
  return result;
}

// ------------------------------------------------------------ //

export async function login(email: string, password: string) {
  const result = await api.post<AuthResponse>(
    "/api/auth/login",
    { email, password },
    { skipSessionRedirect: true }
  );
  await saveToken(result.token);
  return result;
}

// ------------------------------------------------------------ //

// Always clear locally even if the request fails
export async function logout() {
  try {
    await api.post<void>("/api/Auth/logout", {}, { skipSessionRedirect: true });
  } catch (error) {
    logError("Logout request error", error);
  } finally {
    await clearToken();
  }
}

// ------------------------------------------------------------ //

export function forgotPassword(email: string) {
  return api.post<void>("/api/auth/forgot-password", { email }, { skipSessionRedirect: true });
}

// ------------------------------------------------------------ //

// Logs in straight after a successful reset
export async function resetPassword(email: string, resetToken: string, newPassword: string) {
  const result = await api.post<AuthResponse>(
    "/api/auth/reset-password",
    { email, resetToken, newPassword },
    { skipSessionRedirect: true }
  );
  await saveToken(result.token);
  return result;
}

//----------------------------------- END OF FILE ---------------------------------//
