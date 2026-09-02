"use client";

export default function Topbar() {
  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center gap-4 px-6 sticky top-0 z-10">
      <div className="relative flex-1 max-w-md">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Search volunteers, shifts, areas..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
        />
      </div>

      <p className="text-sm text-slate-500 hidden md:block">{today}</p>

      <button className="relative p-2 rounded-lg hover:bg-slate-100" aria-label="Notifications">
        <BellIcon />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
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