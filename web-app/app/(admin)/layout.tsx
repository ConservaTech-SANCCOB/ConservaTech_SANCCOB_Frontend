"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import Sidebar from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, role, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/authentication/login");
    }
  }, [isLoading, token, router]);

  if (isLoading || !token) return null;

  // The web app is admin-only. This is a UX guard, not security: the backend
  // still enforces roles on every request. A signed-in non-admin (e.g. a
  // trainer) gets a message instead of the admin pages. We show a screen
  // rather than redirecting to login, because the login page redirects
  // signed-in users away, which would loop.
  const isAdmin = role?.toLowerCase() === "admin";
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <h1 className="text-lg font-bold text-slate-900">No access</h1>
          <p className="text-sm text-slate-600">
            This portal is for administrators only. Please log out and sign in with an admin account.
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}