"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "../lib/auth-context";
import  Sidebar  from "@/components/layout/sidebar";
import {Topbar}  from "@/components/layout/topbar";


export default function AdminLayout({ children }: { children: React.ReactNode }) {

  const { token, isLoading } = useAuth();
   const router = useRouter();

useEffect(() => {
  if (!isLoading && !token) {
    router.replace("/authentication/login");
  }
}, [isLoading, token, router]);

if (isLoading || !token) return null;

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