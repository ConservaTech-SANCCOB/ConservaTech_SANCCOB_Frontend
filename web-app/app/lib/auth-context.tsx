"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { loginRequest, LoginResponse } from "./api/auth";
import { registerUnauthorizedHandler } from "./api/http";


const API_URL = process.env.NEXT_PUBLIC_API_URL;

//-----------------------------------------------------------------------------------------------//
//<summary>
// Decodes a JWT's payload without verifying the signature (fine client-side —
// the backend still verifies on every request). Returns null if malformed.
//
// JWTs use base64URL encoding (RFC 4648 §5), NOT standard base64: '-' instead
// of '+', '_' instead of '/', and no '=' padding. atob() only understands
// standard base64, so it must be converted first.
//</summary>
//-----------------------------------------------------------------------------------------------//

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Checks whether a JWT has expired using its exp claim. A malformed token is
// treated as expired, and a token with no exp claim is treated as non-expiring.
//</summary>
//-----------------------------------------------------------------------------------------------//
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return true; // malformed token -> treat as invalid
  if (typeof payload.exp !== "number") return false; // no exp claim -> non-expiring
  return Date.now() >= payload.exp * 1000;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Reads a string claim, trying the short key first and then the long .NET
// URI form (the role claim arrives in the long form, so name/email might too).
//</summary>
//-----------------------------------------------------------------------------------------------//
function readClaim(payload: Record<string, unknown> | null, ...keys: string[]): string | null {
  if (!payload) return null;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// The signed-in user's display details, read from the JWT claims.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface AuthUser {
  name: string | null;
  email: string | null;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Shape of the value exposed by the auth context: the current token, role and
// user, the initial loading flag, and the login / logout actions.
//</summary>
//-----------------------------------------------------------------------------------------------//
interface AuthContextType {
  token: string | null;
  role: string | null;
  // Read from the JWT claims. Only as fresh as the token: it won't update
  // mid-session if a profile changes; the user must log in again.
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, keepSignedIn?: boolean) => Promise<void>;
  logout: () => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

//-----------------------------------------------------------------------------------------------//
//<summary>
// Context provider that owns the app's authentication state. Restores a saved
// session on load, exposes login / logout, derives the user from the JWT and
// registers a handler so any 401 from the API logs the user out.
//</summary>
//-----------------------------------------------------------------------------------------------//
export function AuthProvider({ children }: { children: React.ReactNode }) {
 
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loggingOutRef = useRef(false);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Derived from the token, so it can never drift out of sync with it.
  // A token issued before the backend added these claims gives null values.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const user = useMemo<AuthUser | null>(() => {
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    return {
      name: readClaim(payload, "name", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"),
      email: readClaim(payload, "email", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"),
    };
  }, [token]);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Restores a saved session on first load. Reads the token and role from
  // localStorage or sessionStorage, and clears them out if the token is
  // expired or invalid.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      const savedRole = localStorage.getItem("user_role") || sessionStorage.getItem("user_role");

      if (savedToken && savedToken !== "undefined" && !isTokenExpired(savedToken)) {
        setToken(savedToken);
        if (savedRole && savedRole !== "undefined" && savedRole !== "null") setRole(savedRole);
      } else if (savedToken) {
        
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_role");
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("user_role");
      }
    }
    setIsLoading(false);
  }, []);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Logs the user in via the API. Throws if no token or role is returned,
  // stores the session in localStorage (keep signed in) or sessionStorage
  // (this session only), and resets the logging-out guard.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
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

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Logs the user out. Clears the token, role and stored session, then tells
  // the backend (fire-and-forget). Guarded so simultaneous calls only run once.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const logout = useCallback(() => {
    if (loggingOutRef.current) return; 
    loggingOutRef.current = true;

    const currentToken = token;

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

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Bridge for http.ts: any apiFetch call anywhere in the app that gets a
  // 401 back from the backend (a session that died mid-use, not just a
  // missing token on load) triggers this, which clears auth state. The
  // AdminLayout's existing `!token` redirect then sends the user to login —
  // logout() itself doesn't need to know how to navigate.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);


  return (
    <AuthContext.Provider value={{ token, role, user, isLoading, login, logout }}>
      {/*------------------------------------ App Content ----------------------------------------------------*/}
      {children}
    </AuthContext.Provider>
  );
}


//-----------------------------------------------------------------------------------------------//
//<summary>
// Hook for reading the auth context. Throws if used outside an AuthProvider.
//</summary>
//-----------------------------------------------------------------------------------------------//
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//