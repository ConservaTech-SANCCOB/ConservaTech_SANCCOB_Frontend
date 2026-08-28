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
): Promise<LoginResponse> {

    // Simulating network delay
    await new Promise((resolve) => setTimeout(resolve, 700));
    
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
