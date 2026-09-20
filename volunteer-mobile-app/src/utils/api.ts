import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Copy volunteer-mobile-app/.env.example to .env and fill it in."
  );
}

const TOKEN_KEY = "auth_token";

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired — please log in again.");
    this.name = "SessionExpiredError";
  }
}

interface RequestConfig {
  skipSessionRedirect?: boolean;
}

async function request<T>(path: string, options: RequestInit = {}, config: RequestConfig = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && !config.skipSessionRedirect) {
    await clearToken();
    router.replace("/login");
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown, config?: RequestConfig) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, config),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

/** Extracts the HTTP status from an Error thrown by request() above, so callers
 * can map known status codes (e.g. 401) to a specific human-readable message
 * instead of showing the raw "API error 401: <body>" text to the user. */
export function getErrorStatus(error: unknown): number | null {
  if (!(error instanceof Error)) return null;
  const match = error.message.match(/^API error (\d+):/);
  return match ? Number(match[1]) : null;
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}