const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Matches the exact backend Swagger response schema
export interface LoginResponse {
  token: string;
  role: string;
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
      password: password.trim(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Invalid email or password");
  }

  const data: LoginResponse = await response.json();
  
  console.log("[Auth API Response]", data);

  return data;
}



//----------------------------------- END OF FILE ---------------------------------//
    // Mock response for testing purposes
//     if (email === "cathy@sanccob.co.za" && password === "password123") {
//         return {
//             token: "mock-jwt-token-123",
//             user: {
//                 id: "1",
//                 name: "Cathy",
//                 email: "cathy@sanccob.co.za",
//                 role: "admin"
//             }
//         };
//     } 
//         throw new Error("Invalid email or password");
    
// }
