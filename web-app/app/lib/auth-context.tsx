"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest, LoginResponse } from "./api/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Decodes a JWT's payload without verifying the signature (fine client-side —
// we're just checking expiry, the backend still verifies on every request).
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false; // no exp claim -> treat as non-expiring
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // malformed token -> treat as invalid
  }
}

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      const savedRole = localStorage.getItem("user_role") || sessionStorage.getItem("user_role");

      if (savedToken && savedToken !== "undefined" && !isTokenExpired(savedToken)) {
        setToken(savedToken);
        if (savedRole && savedRole !== "undefined") setRole(savedRole);
      } else if (savedToken) {
        // stale/expired token sitting in storage -> clear it out
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_role");
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("user_role");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, keepSignedIn: boolean = false) => {
     
  const data: LoginResponse = await loginRequest(email, password);

if (!data.token) {
  throw new Error("Login failed. Please try again.");
}
  
    
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
      const currentToken = token; // Capture the current token for the API call

    setToken(null);
    setRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_role");
    }

     if (API_URL && currentToken) {
    fetch(`${API_URL}/api/Auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${currentToken}` },
    }).catch(() => {});
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
