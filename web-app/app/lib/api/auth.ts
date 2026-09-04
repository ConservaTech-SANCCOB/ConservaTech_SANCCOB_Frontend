const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface LoginResponse {
  token: string;
  role: string;
}

export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
  }

  // Updated to match backend route: /api/Auth/login
  const response = await fetch(`${API_URL}/api/Auth/login`, {
    method: "POST",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      password: password.trim(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Invalid email or password");
  }

  const data: LoginResponse = await response.json();
  return data;
}


