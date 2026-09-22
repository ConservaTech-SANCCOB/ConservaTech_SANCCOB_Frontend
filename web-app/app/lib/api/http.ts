// app/lib/api/http.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function apiFetch<T = unknown>(
  endpoint: string,
  token: string | null,
  options: RequestInit = {},
  errorMessage = "API request failed"
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

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
      }
    } catch {
      // Response was not JSON, so keep the default error message.
    }

    throw new Error(`${message} (${response.status})`);
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