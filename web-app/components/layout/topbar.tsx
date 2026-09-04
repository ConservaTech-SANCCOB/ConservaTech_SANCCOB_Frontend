"use client";

import { useState, useEffect } from "react";

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Topbar() {
  const [today, setToday] = useState<string>("");

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

  return (
    <header className="h-16 border-b flex items-center justify-between px-6">
      <div className="relative flex items-center w-64">
        <span className="absolute left-3 text-slate-400">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      <p className="text-sm text-slate-500 hidden md:block">{today}</p>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-slate-100" aria-label="Notifications">
          <BellIcon />
      </button>
    
      <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
        <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold">
          CA
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-slate-900 leading-tight">Cathy Adams</p>
          <p className="text-xs text-slate-500 leading-tight">Admin</p>
        </div>
      </div>
     </div>
    </header>
    );
  }
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
