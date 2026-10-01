import * as SecureStore from "expo-secure-store";
import { resetTo } from "./navigation";

//--------------------SETUP--------------------//

// Fail fast if the API URL is missing
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Copy volunteer-mobile-app/.env.example to .env and fill it in."
  );
}

const TOKEN_KEY = "auth_token";
const SESSION_ROLE_KEY = "session_role";

export type SessionRole = "volunteer" | "trainer";

//--------------------ERRORS--------------------//

// Thrown on a 401 so screens skip their own error toast
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired — please log in again.");
    this.name = "SessionExpiredError";
  }
}

// ------------------------------------------------------------ //

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

// ------------------------------------------------------------ //

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
    // Not JSON so there is no message to show
  }
  return null;
}

//--------------------REQUEST--------------------//

interface RequestConfig {
  // For login calls where a 401 means wrong details
  skipSessionRedirect?: boolean;
}

// ------------------------------------------------------------ //

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

  // Session expired so clear it and go back to the start
  if (response.status === 401 && !config.skipSessionRedirect) {
    const role = await getSessionRole();
    await clearToken();
    resetTo(role === "trainer" ? "/" : "/login");
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body);
  }

  // Some endpoints reply with no body
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ------------------------------------------------------------ //

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown, config?: RequestConfig) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, config),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

//--------------------ERROR HELPERS--------------------//

export function getErrorStatus(error: unknown): number | null {
  if (!(error instanceof Error)) return null;
  const match = error.message.match(/^API error (\d+):/);
  return match ? Number(match[1]) : null;
}

// ------------------------------------------------------------ //

// Only show backend messages for 4xx errors
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.backendMessage) {
    return error.backendMessage;
  }
  return fallback;
}

//--------------------SESSION--------------------//

// The role decides if the session is restored on relaunch
export async function saveToken(token: string, role: SessionRole = "volunteer") {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(SESSION_ROLE_KEY, role);
}

// ------------------------------------------------------------ //

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(SESSION_ROLE_KEY);
}

// ------------------------------------------------------------ //

export async function getSessionRole(): Promise<SessionRole> {
  return (await SecureStore.getItemAsync(SESSION_ROLE_KEY)) === "trainer" ? "trainer" : "volunteer";
}

// ------------------------------------------------------------ //

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

//----------------------------------- END OF FILE ---------------------------------//
