import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Copy volunteer-mobile-app/.env.example to .env and fill it in."
  );
}

const TOKEN_KEY = "auth_token";
const SESSION_ROLE_KEY = "session_role";

/** Who the stored token belongs to. Trainer sessions come from the PIN flow on a
 * shared device, so they are never restored on the next launch (see _layout.tsx). */
export type SessionRole = "volunteer" | "trainer";

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired — please log in again.");
    this.name = "SessionExpiredError";
  }
}

/** Thrown by request() for any non-2xx response (other than a redirected 401).
 * The message keeps the "API error <status>: <body>" format that getErrorStatus()
 * relies on; `backendMessage` is the human-readable `message` from the backend's
 * JSON body, when there is one. */
export class ApiError extends Error {
  status: number;
  backendMessage: string | null;

  constructor(status: number, body: string) {
    super(`API error ${status}: ${body}`);
    this.name = "ApiError";
    this.status = status;
    this.backendMessage = parseBackendMessage(body);
  }
}

/** Pulls a displayable message out of an error response body: `message` first
 * (the backend's own convention), then ASP.NET ProblemDetails' `detail`, then the
 * first model-validation error. Returns null for non-JSON or message-less bodies. */
export function parseBackendMessage(body: string): string | null {
  try {
    const parsed = JSON.parse(body);
    for (const candidate of [parsed?.message, parsed?.detail]) {
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
    if (parsed?.errors && typeof parsed.errors === "object") {
      const first = Object.values(parsed.errors).flat()[0];
      if (typeof first === "string" && first.trim()) return first.trim();
    }
  } catch {
    // not JSON — nothing to show
  }
  return null;
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
    throw new ApiError(response.status, body);
  }

  // Several endpoints (profile/availability saves, sign-off, logout) answer a bare
  // 200 with no body, which response.json() would reject as invalid JSON.
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
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

/** The message to show the user for a failed request: the backend's own message
 * for 4xx responses (validation, bad input — written for users), otherwise the
 * caller's fallback. 5xx bodies are never shown, since they can carry internals. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.backendMessage) {
    return error.backendMessage;
  }
  return fallback;
}

export async function saveToken(token: string, role: SessionRole = "volunteer") {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(SESSION_ROLE_KEY, role);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(SESSION_ROLE_KEY);
}
export async function getSessionRole(): Promise<SessionRole> {
  return (await SecureStore.getItemAsync(SESSION_ROLE_KEY)) === "trainer" ? "trainer" : "volunteer";
}
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}