"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../app/lib/auth-context";
import { PenguinFace } from "../ui/penguin";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Shows its children only to a signed-in admin. Signed-out visitors go to the login page, and a
// signed-in non-admin (e.g. a trainer) sees a "No access" screen. Used by the admin pages and by
// the full-screen room screen, which has no sidebar.
//
// This is a UX guard, not security: the backend still enforces roles on every request. We show a
// screen rather than redirecting a non-admin to login, because the login page redirects signed-in
// users away, which would loop. (Moved here unchanged from app/(admin)/layout.tsx.)
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { token, role, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/authentication/login");
    }
  }, [isLoading, token, router]);

  if (isLoading || !token) return null;

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

  return <>{children}</>;
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//