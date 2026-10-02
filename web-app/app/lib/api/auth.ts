
const API_URL = process.env.NEXT_PUBLIC_API_URL;


//-----------------------------------------------------------------------------------------------//
//<summary>
// Matches the exact backend Swagger response schema (AuthResponseDto).
// Both fields are marked nullable in the spec — auth-context.tsx's login()
// checks for both before trusting this response.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface LoginResponse {
  token: string | null;
  role: string | null;
}

//-------------------------------------------API REQUESTS--------------------------------------------------------------------//


//-----------------------------------------------------------------------------------------------//
//<summary>
// Sends the user's credentials to the backend login endpoint (POST /api/Auth/login).
// Throws if NEXT_PUBLIC_API_URL is not set or the request fails (401/400 give an
// "invalid credentials" style message). Returns the token and role on success.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {

  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  //-----------------------------------------------------------------------------------------------//
  // Send Login Request
  //-----------------------------------------------------------------------------------------------//
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

  //-----------------------------------------------------------------------------------------------//
  // Error Handling
  //-----------------------------------------------------------------------------------------------//
    if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[Login] ${response.status}`, errorData);

    if (response.status === 401 || response.status === 400) {
      throw new Error(errorData.message || "Invalid email or password");
    }
    throw new Error(errorData.message || `Login failed (${response.status})`);
  }

  //-----------------------------------------------------------------------------------------------//
  // Parse & Return Response
  //-----------------------------------------------------------------------------------------------//
  const data: LoginResponse = await response.json();
  
  return data;
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//

