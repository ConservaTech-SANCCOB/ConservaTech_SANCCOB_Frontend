"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { loginRequest, LoginResponse } from "./api/auth";
import { registerUnauthorizedHandler } from "./api/http";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Decodes a JWT's payload without verifying the signature (fine client-side —
// we're just checking expiry, the backend still verifies on every request).
//
// JWTs use base64URL encoding (RFC 4648 §5), NOT standard base64: '-' instead
// of '+', '_' instead of '/', and no '=' padding. atob() only understands
// standard base64, so it must be converted first — otherwise any token whose
// payload happens to contain a '-' or '_' (common, not an edge case) throws
// or decodes to garbage, and gets wrongly treated as expired below.
function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
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
  // Guards against multiple simultaneous 401s (e.g. a page firing several
  // requests in parallel via Promise.all) each triggering their own logout —
  // React state updates are batched/async, so checking `token` alone isn't
  // enough to dedupe calls that happen in the same tick.
  const loggingOutRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      const savedRole = localStorage.getItem("user_role") || sessionStorage.getItem("user_role");

      if (savedToken && savedToken !== "undefined" && !isTokenExpired(savedToken)) {
        setToken(savedToken);
        if (savedRole && savedRole !== "undefined" && savedRole !== "null") setRole(savedRole);
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

  const login = useCallback(async (email: string, password: string, keepSignedIn: boolean = false) => {
    const data: LoginResponse = await loginRequest(email, password);

    if (!data.token) {
      throw new Error("Login failed. Please try again.");
    }
    if (!data.role) {
      // Backend schema marks role as nullable — surface this loudly rather
      // than silently storing an unusable role and letting role-gated routes
      // fail confusingly later.
      throw new Error("Login succeeded but no role was returned. Please contact an administrator.");
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

    // A fresh login means any prior "already logging out" state is stale.
    loggingOutRef.current = false;
  }, []);

  const logout = useCallback(() => {
    if (loggingOutRef.current) return; // already in progress this session
    loggingOutRef.current = true;

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
  }, [token]);

  // Bridge for http.ts: any apiFetch call anywhere in the app that gets a
  // 401 back from the backend (a session that died mid-use, not just a
  // missing token on load) triggers this, which clears auth state. The
  // AdminLayout's existing `!token` redirect then sends the user to login —
  // logout() itself doesn't need to know how to navigate.
  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

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