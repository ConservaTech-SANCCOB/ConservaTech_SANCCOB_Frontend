const API_URL = process.env.NEXT_PUBLIC_API_URL;

// change to true once backend admin login is implemented
const USE_REAL_API = false;

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
    if (USE_REAL_API) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error("Invalid email or password");
        }

// remove the console.log statement in production code once the backend is implemented and tested and you know everything matches up (token and user object structure)
        const data = await response.json();
        console.log(data);
        return data;
    }

//----------------------------------- END OF FILE ---------------------------------//
    // Mock response for testing purposes
    if (email === "cathy@sanccob.co.za" && password === "password123") {
        return {
            token: "mock-jwt-token-123",
            user: {
                id: "1",
                name: "Cathy",
                email: "cathy@sanccob.co.za",
                role: "admin"
            }
        };
    } 
        throw new Error("Invalid email or password");
    
}
