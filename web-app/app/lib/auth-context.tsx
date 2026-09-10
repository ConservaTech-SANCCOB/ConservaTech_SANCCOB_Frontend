"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest, LoginResponse } from "./api/auth";

interface AuthContextType {
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: string, keepSignedIn?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on refresh (checks both localStorage and sessionStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      const savedRole = localStorage.getItem("user_role") || sessionStorage.getItem("user_role");

      if (savedToken && savedToken !== "undefined") setToken(savedToken);
      if (savedRole && savedRole !== "undefined") setRole(savedRole);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, keepSignedIn: boolean = false) => {
    const data: LoginResponse = await loginRequest(email, password);
    
    setToken(data.token);
    setRole(data.role);

    if (typeof window !== "undefined") {
      // Choose storage strategy based on checkbox
      const storage = keepSignedIn ? localStorage : sessionStorage;
      
      // Clear both first to prevent duplicate/stale tokens
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_role");

      storage.setItem("auth_token", data.token);
      storage.setItem("user_role", data.role);
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_role");
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
