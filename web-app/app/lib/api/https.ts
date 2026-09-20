const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Error thrown for any non-2xx response. `status` lets callers react
 * to specific cases (e.g. 401 = token missing/expired -> log the user out).
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

/**
 * Authenticated JSON request to the backend.
 * - Refuses to send a request without a token (no more "Bearer null")
 * - Throws ApiError with the backend's message (or a fallback) on failure
 * - Copes with 200 responses that have an empty body
 */
export async function apiFetch<T = void>(
  path: string,
  token: string | null,
  options: RequestInit = {},
  fallbackMessage = "Request failed"
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }
  if (!token) {
    throw new ApiError("You are not signed in.", 401);
  }

  const hasBody = options.body !== undefined;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // ASP.NET validation errors look like { title, errors: { Field: ["msg"] } }
    let validation = "";
    if (errorData && typeof errorData.errors === "object" && errorData.errors) {
      validation = Object.values(errorData.errors as Record<string, string[]>)
        .flat()
        .join(" ");
    }

    throw new ApiError(
      errorData?.message || validation || errorData?.title || fallbackMessage,
      response.status
    );
  }

  const text = await response.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}