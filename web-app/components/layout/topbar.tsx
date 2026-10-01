"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../app/lib/auth-context";
import { getInitials, getDisplayName, getRoleLabel } from "../../app/lib/user-display";
import { useNotifications } from "../../app/lib/use-notifications";
import type { AdminNotification } from "../../app/lib/api/notifications";

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const EVENT_LABELS: Record<string, string> = {
  volunteer_registered: "New volunteer",
  change_request_submitted: "Change request",
  shift_vacant: "Shift vacant",
};

// Where a notification takes you when clicked. change_request_submitted has no
// entry yet: we haven't confirmed which page handles change requests.
const EVENT_ROUTES: Record<string, string> = {
  volunteer_registered: "/volunteers",
  shift_vacant: "/vacancies",
};

function eventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}

// createdAt can carry 7 fractional digits; trim to 3 so every browser parses it.
function timeAgo(iso: string): string {
  const then = new Date(iso.replace(/(\.\d{3})\d+/, "$1")).getTime();
  if (isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

const MAX_SHOWN = 20;

export function Topbar() {
  const { logout, user, role } = useAuth();
  const router = useRouter();
  const { items, unreadCount, connected, error, markRead, markAllRead } = useNotifications();
  const [today, setToday] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial client-side set
    setToday(getFormattedDate());

    let intervalId: NodeJS.Timeout;

    // Calculate time remaining until midnight tonight
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0, 0
    );
    const msUntilMidnight = midnight.getTime() - now.getTime();

    // Schedule exact midnight update
    const timeoutId = setTimeout(() => {
      setToday(getFormattedDate());

      // After the first midnight trigger, run every 24 hours
      intervalId = setInterval(() => {
        setToday(getFormattedDate());
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Close either menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen && !bellOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(target)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, bellOpen]);

  const handleNotificationClick = (n: AdminNotification) => {
    if (!n.isRead) markRead(n.notificationId);
    const route = EVENT_ROUTES[n.eventType];
    if (route) {
      setBellOpen(false);
      router.push(route);
    }
  };

  const itemClass =
    "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors";

  return (
    <header className="h-16 border-b flex items-center justify-between px-6">
      <div className="relative flex items-center w-64">
        <span className="absolute left-3 text-slate-600">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-4 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      <p className="text-sm text-slate-500 hidden md:block">{today}</p>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => {
              setBellOpen((o) => !o);
              setMenuOpen(false);
            }}
            className="relative p-2 rounded-lg hover:bg-slate-100"
            aria-label={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
            }
            aria-haspopup="menu"
            aria-expanded={bellOpen}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {error && (
                  <p className="m-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                {items.length === 0 && !error ? (
                  <p className="px-3 py-8 text-center text-sm text-slate-500">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  items.slice(0, MAX_SHOWN).map((n) => (
                    <button
                      key={n.notificationId}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex w-full items-start gap-2.5 px-3 py-3 text-left border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                        n.isRead ? "" : "bg-blue-50/50"
                      }`}
                    >
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          n.isRead ? "bg-transparent" : "bg-blue-600"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-900">
                          {eventLabel(n.eventType)}
                        </span>
                        <span className="block text-xs text-slate-600 mt-0.5">{n.message}</span>
                        <span className="block text-[11px] text-slate-400 mt-1">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>

              {!connected && (
                <p className="px-3 py-2 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100">
                  Live updates aren&apos;t connected. Showing the latest saved notifications.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative pl-2 border-l border-slate-200" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen((o) => !o);
              setBellOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100 transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold">
              {getInitials(user)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 leading-tight">{getDisplayName(user)}</p>
              <p className="text-xs text-slate-500 leading-tight">{getRoleLabel(role)}</p>
            </div>
            <ChevronIcon open={menuOpen} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="px-3 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">{getDisplayName(user)}</p>
                {user?.email && <p className="text-xs text-slate-500 truncate">{user.email}</p>}
              </div>

              <div className="py-1">
                <Link
                  href="/settings?tab=profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className={itemClass}
                >
                  <UserIcon />
                  My Profile
                </Link>
                <Link
                  href="/settings?tab=system"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className={itemClass}
                >
                  <SettingsIcon />
                  Settings
                </Link>
              </div>

              <div className="py-1 border-t border-slate-100">
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className={`${itemClass} text-red-600 hover:bg-red-50`}
                >
                  <LogoutIcon />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-700 hover:text-slate-900 transition-colors"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}