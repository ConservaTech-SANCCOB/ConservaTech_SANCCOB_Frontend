const API_URL = process.env.NEXT_PUBLIC_API_URL;

// change to true once backend admin login is implemented
const USE_REAL_API = true;

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;   
    };
}

export async function loginRequest(
    email: string,
    password: string
):
 Promise<LoginResponse> {
        if (!API_URL) {
            throw new Error("API URL is not defined");
        }
        const response = await fetch(`${API_URL}/authentication/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Invalid email or password");
  }

        const data = await response.json();

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
