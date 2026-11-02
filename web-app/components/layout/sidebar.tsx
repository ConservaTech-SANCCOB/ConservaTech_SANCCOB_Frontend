"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../app/lib/auth-context";
import { getInitials, getDisplayName, getRoleLabel } from "../../app/lib/user-display";
import { PenguinFace } from "../ui/penguin";
import { LineIcon } from "../ui/line-icon";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Main menu. Each item is a label, a route and one SVG path for its icon (24 x 24, drawn with a 2px line).
//</summary>
//---------------------------------------------------------------------------------------------------------------//
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "M3.5 3.5h7v7h-7zM13.5 3.5h7v7h-7zM3.5 13.5h7v7h-7zM13.5 13.5h7v7h-7z" },
  {
    label: "Volunteers",
    href: "/volunteers",
    icon: "M12.5 8.5a3.5 3.5 0 1 1-7 0a3.5 3.5 0 1 1 7 0M2.8 20c.9-3.5 3.3-5.3 6.2-5.3s5.3 1.8 6.2 5.3M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.6 14.9c1.7.8 2.9 2.4 3.4 5.1",
  },
  { label: "Roster Management", href: "/roster", icon: "M4 6h16v14H4zM4 10h16M8.5 3.5v4M15.5 3.5v4" },
  { label: "Shift Scheduling", href: "/shifts", icon: "M20.5 12a8.5 8.5 0 1 1-17 0a8.5 8.5 0 1 1 17 0M12 7.5V12l3 2" },
  { label: "Staff Training", href: "/training-staff", icon: "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6" },
  { label: "Vacancies", href: "/vacancies", icon: "M3 7h18v13H3zM9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" },
  { label: "Reports", href: "/reports", icon: "M4 19h16M5 15l4-4 4 3 6-7" },
  {
    label: "Settings",
    href: "/settings",
    icon: "M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1",
  },
];

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Navy sidebar with the penguin logo, big pill-shaped links (the current page is the sand pill),
// a labelled "Hide menu" button and the signed-in admin. Collapsed, it shows icons only.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, role } = useAuth();

  return (
    <aside
      className={`${
        collapsed ? "w-21" : "w-68"
      } shrink-0 bg-sidebar text-white flex flex-col h-screen sticky top-0 transition-[width] duration-200`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 pt-6 pb-5 ${collapsed ? "justify-center" : "px-5"}`}>
        <span className="w-12 h-12 shrink-0 rounded-full bg-white flex items-center justify-center">
          <PenguinFace size={36} />
        </span>
        {!collapsed && (
          <span className="min-w-0 flex flex-col leading-tight">
            <span className="text-xl font-black truncate">SANCCOB Portal</span>
            <span className="text-sm font-bold text-sidebar-muted truncate">by ConservaTech</span>
          </span>
        )}
      </div>

      {/* Menu */}
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-4 py-1 flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3.5 min-h-13 rounded-full transition-colors ${
                collapsed ? "justify-center" : "px-4"
              } ${isActive ? "bg-sand text-sand-ink font-black" : "font-bold text-white hover:bg-sidebar-hover"}`}
            >
              <LineIcon d={item.icon} size={22} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Hide menu + signed-in admin. Name and role come from the JWT claims via useAuth(). */}
      <div className="mx-4 pt-3 pb-5 border-t border-sidebar-line flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Show menu" : "Hide menu"}
          title={collapsed ? "Show menu" : undefined}
          className={`flex items-center gap-3.5 min-h-12 rounded-full font-bold text-sidebar-muted hover:bg-sidebar-hover hover:text-white transition-colors ${
            collapsed ? "justify-center" : "px-4"
          }`}
        >
          <LineIcon d={collapsed ? "M13 6l6 6-6 6M5 6l6 6-6 6" : "M11 6l-6 6 6 6M19 6l-6 6 6 6"} size={22} />
          {!collapsed && <span>Hide menu</span>}
        </button>

        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-1"}`}>
          <span
            className="w-11 h-11 shrink-0 rounded-full bg-sand text-sand-ink font-black text-lg flex items-center justify-center"
            title={collapsed ? getDisplayName(user) : undefined}
          >
            {getInitials(user)}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex flex-col leading-tight">
              <span className="font-extrabold truncate">{getDisplayName(user)}</span>
              <span className="text-sm text-sidebar-muted truncate">{getRoleLabel(role)}</span>
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

//-------------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------------//
