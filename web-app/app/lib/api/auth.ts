const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Matches the exact backend Swagger response schema (AuthResponseDto).
// Both fields are marked nullable in the spec — auth-context.tsx's login()
// checks for both before trusting this response.
export interface LoginResponse {
  token: string | null;
  role: string | null;
}

export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const response = await fetch(`${API_URL}/api/Auth/login`, {
    method: "POST",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      password: password,
    }),
  });

    if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[Login] ${response.status}`, errorData);

    if (response.status === 401 || response.status === 400) {
      throw new Error(errorData.message || "Invalid email or password");
    }
    throw new Error(errorData.message || `Login failed (${response.status})`);
  }
  const data: LoginResponse = await response.json();
  
  return data;
}

