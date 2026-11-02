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

// Colour and icon for each kind of notification, so Cathy can tell them apart at a glance:
// green for a new volunteer, sand for a change request, orange for an open spot.
const EVENT_STYLES: Record<string, { chip: string; icon: string }> = {
  volunteer_registered: {
    chip: "bg-ok text-ok-ink",
    icon: "M10 8.5a3.5 3.5 0 1 1-7 0a3.5 3.5 0 1 1 7 0M1.5 20c.8-3.4 2.9-5.2 5-5.2s4.2 1.8 5 5.2M18 8v8M14 12h8",
  },
  change_request_submitted: {
    chip: "bg-warn text-warn-ink",
    icon: "M4 8h13l-3.5-3.5M20 16H7l3.5 3.5",
  },
  shift_vacant: {
    chip: "bg-alert text-alert-ink",
    icon: "M12 4v9M12 18.5v.5",
  },
};
const DEFAULT_EVENT_STYLE = { chip: "bg-surface-sunken text-ink-strong", icon: "M12 8v5M12 16.5v.5" };

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

  // Shared layout for profile-menu items. Colours are kept separate so the
  // logout item can use its own without two text colours competing.
  const itemBase =
    "flex w-full items-center gap-3 px-4 min-h-12 text-base font-bold transition-colors";
  const itemClass = `${itemBase} text-ink hover:bg-tint`;
  const logoutClass = `${itemBase} text-urgent-ink hover:bg-urgent`;

  return (
    <header className="bg-surface border-b-[1.5px] border-line px-[clamp(16px,3vw,40px)] py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="relative flex items-center flex-1 min-w-56 max-w-md">
        <span className="absolute left-4 text-ink-muted pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Search..."
          aria-label="Search"
          className="w-full min-h-12 pl-12 pr-4 text-base font-semibold text-ink placeholder:text-ink-faint bg-surface-muted border-[1.5px] border-line rounded-full focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/20"
        />
      </div>

      {/* The date only shows when there's room, so the bell and profile never wrap to a second line */}
      <p className="hidden xl:block ml-auto font-extrabold text-ink">{today}</p>

      <div className="flex items-center gap-3 ml-auto xl:ml-0">
        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => {
              setBellOpen((o) => !o);
              setMenuOpen(false);
            }}
            className="relative w-12 h-12 rounded-full border-[1.5px] border-line bg-surface text-ink-strong hover:bg-tint flex items-center justify-center transition-colors"
            aria-label={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
            }
            aria-haspopup="menu"
            aria-expanded={bellOpen}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-alert text-alert-ink text-xs font-black flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-3 w-[min(26rem,calc(100vw-2rem))] bg-surface border-[1.5px] border-line rounded-3xl shadow-xl shadow-black/10 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-line-soft">
                <p className="text-lg font-black text-ink-strong">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-sm font-bold text-brand hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-[28rem] overflow-y-auto">
                {error && (
                  <p className="m-4 text-sm font-semibold text-urgent-ink bg-urgent border border-urgent-line/40 rounded-2xl px-4 py-3">
                    {error}
                  </p>
                )}
                {items.length === 0 && !error ? (
                  <p className="px-5 py-10 text-center text-base text-ink-muted">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  items.slice(0, MAX_SHOWN).map((n) => {
                    const style = EVENT_STYLES[n.eventType] ?? DEFAULT_EVENT_STYLE;
                    return (
                      <button
                        key={n.notificationId}
                        onClick={() => handleNotificationClick(n)}
                        className={`flex w-full items-start gap-3 px-5 py-4 text-left border-b border-line-soft last:border-b-0 hover:bg-tint transition-colors ${
                          n.isRead ? "" : "bg-surface-muted"
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${style.chip}`}
                          aria-hidden="true"
                        >
                          <SmallIcon d={style.icon} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-extrabold text-ink">
                            {eventLabel(n.eventType)}
                            {!n.isRead && (
                              <>
                                <span className="w-2.5 h-2.5 rounded-full bg-alert shrink-0" aria-hidden="true" />
                                <span className="sr-only">Unread</span>
                              </>
                            )}
                          </span>
                          <span className="block text-sm text-ink-muted mt-0.5">{n.message}</span>
                          <span className="block text-xs font-semibold text-ink-faint mt-1">
                            {timeAgo(n.createdAt)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {!connected && (
                <p className="px-5 py-3 text-xs font-semibold text-ink-muted bg-surface-muted border-t border-line-soft">
                  Live updates aren&apos;t connected. Showing the latest saved notifications.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen((o) => !o);
              setBellOpen(false);
            }}
            className="flex items-center gap-2.5 min-h-12 rounded-full border-[1.5px] border-line pl-1 pr-3 hover:bg-tint transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open profile menu"
          >
            <span className="w-10 h-10 rounded-full bg-sand text-sand-ink flex items-center justify-center font-black">
              {getInitials(user)}
            </span>
            <span className="hidden sm:block text-left">
              <span className="block text-sm font-extrabold text-ink leading-tight">{getDisplayName(user)}</span>
              <span className="block text-xs font-semibold text-ink-muted leading-tight">{getRoleLabel(role)}</span>
            </span>
            <ChevronIcon open={menuOpen} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-3 w-64 bg-surface border-[1.5px] border-line rounded-3xl shadow-xl shadow-black/10 z-50 overflow-hidden"
            >
              <div className="px-4 py-4 border-b border-line-soft">
                <p className="text-base font-extrabold text-ink truncate">{getDisplayName(user)}</p>
                {user?.email && <p className="text-sm text-ink-muted truncate">{user.email}</p>}
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

              <div className="py-1 border-t border-line-soft">
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className={logoutClass}
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
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

// 18px icon for a notification's coloured circle.
function SmallIcon({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//
