"use client";
import { AdminGuard } from "@/components/layout/admin-guard";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Full-screen pages for a TV, like the volunteer room screen: the same admin-only guard as the
// admin pages, but no sidebar or top bar.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//