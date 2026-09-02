"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Volunteers", href: "/volunteers", icon: VolunteersIcon },
  { label: "Roster Management", href: "/roster", icon: RosterIcon },
  { label: "Shift Scheduling", href: "/shifts", icon: ShiftsIcon },
  { label: "Staff Training", href: "/training", icon: TrainingIcon },
  { label: "Vacancies", href: "/vacancies", icon: VacanciesIcon },
  { label: "Reports", href: "/reports", icon: ReportsIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } shrink-0 bg-[#0B2447] text-white flex flex-col transition-all duration-200 h-screen sticky top-0`}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
          CT
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">ConservaTech</p>
            <p className="text-xs text-white/60 truncate">SANCCOB Portal</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto p-1.5 rounded-md hover:bg-white/10 shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-700 text-white font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold shrink-0">
          CA
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">Cathy Adams</p>
            <p className="text-xs text-white/60 truncate">Administrator</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function iconProps() {
  return { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
}

function DashboardIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
function VolunteersIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
      <circle cx="18" cy="7" r="3" />
      <path d="M22 21v-1.5a4 4 0 0 0-3-3.87" />
    </svg>
  );
}
function RosterIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  );
}
function ShiftsIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function TrainingIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M22 10L12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}
function VacanciesIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 3 3 5-7" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}