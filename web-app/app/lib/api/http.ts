// app/lib/api/http.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/**
 * Error thrown for any non-2xx response. `status` lets callers react
 * to specific cases (e.g. 401 = token missing/expired -> log the user out,
 * 409 = conflict -> show a specific message instead of a generic one).
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  token: string | null,
  options: RequestInit = {},
  errorMessage = "API request failed"
): Promise<T> {
  if (!token) {
    // Refuse to send an unauthenticated request rather than silently
    // dropping the Authorization header and letting the backend 401 it.
    throw new ApiError("You are not signed in.", 401);
  }

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = errorMessage;

    try {
      const errorData = await response.json();

      if (typeof errorData?.message === "string") {
        message = errorData.message;
      } else if (typeof errorData?.title === "string") {
        message = errorData.title;
      } else if (errorData && typeof errorData.errors === "object") {
        // ASP.NET validation errors look like { title, errors: { Field: ["msg"] } }
        const validation = Object.values(errorData.errors as Record<string, string[]>)
          .flat()
          .join(" ");
        if (validation) message = validation;
      }
    } catch {
      // Response was not JSON, so keep the default error message.
    }

    throw new ApiError(message, response.status);
  }

  // Some DELETE/PUT endpoints may return 204 No Content.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}