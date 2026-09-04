"use client";

import { createContext, useContext, useState } from "react";
import { loginRequest, LoginResponse } from "./api/auth";

interface AuthContextType {
  token: string | null;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const data: LoginResponse = await loginRequest(email, password);
    
    // Store in state / session memory
    setToken(data.token);
    setRole(data.role);

    // Save token for subsequent API calls
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth_token", data.token);
      sessionStorage.setItem("user_role", data.role);
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_role");
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
