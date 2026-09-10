import { api, saveToken } from "../utils/api";

interface AuthResponse {
  token: string;
  role: string;
}

export async function activate(email: string, otp: string, newPassword: string) {
  const result = await api.post<AuthResponse>("/api/auth/activate", {
    email,
    otp,
    newPassword,
  });
  await saveToken(result.token);
  return result;
}

export async function login(email: string, password: string) {
  const result = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  await saveToken(result.token);
  return result;
}