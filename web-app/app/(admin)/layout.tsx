"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import Sidebar from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PenguinFace } from "@/components/ui/penguin";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Admin shell: auth guard, admin-only role check, then Sidebar + Topbar around the page content.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
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
      <div className="min-h-screen bg-page flex items-center justify-center p-6">
        <div className="bg-surface rounded-3xl border-[1.5px] border-line p-8 max-w-md w-full text-center flex flex-col items-center gap-4">
          <PenguinFace size={64} />
          <h1 className="text-2xl font-black text-ink-strong">No access</h1>
          <p className="text-base text-ink-muted">
            This portal is for administrators only. Please log out and sign in with an admin account.
          </p>
          <button
            onClick={logout}
            className="min-h-12 px-6 rounded-full text-base font-black bg-brand text-brand-ink hover:bg-brand-hover transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  // The page area is capped at 1180px and centred, so lines of text and tables stay a
  // comfortable width on big screens. The side padding grows with the window (16px to 40px).
  return (
    <div className="flex min-h-screen bg-page text-ink">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 w-full max-w-[1180px] mx-auto px-[clamp(16px,3vw,40px)] pt-8 pb-14">{children}</main>
      </div>
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//