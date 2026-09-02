"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../../lib/auth-context";
import { fetchDashboardStats, DashboardStats } from "../../lib/api/dashboard";

const NAVY = "#0B2447";
const BLUE = "#2563EB";
const LIGHT_BLUE = "#60A5FA";
const GREEN = "#16A34A";

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        setError("");
        const data = await fetchDashboardStats(token);
        setStats(data);
      } catch (err) {
        setError("Couldn't load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error || "Something went wrong."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Cathy 👋</h1>
        <p className="text-slate-500 mt-1">
          Here&apos;s what&apos;s happening at SANCCOB today.
        </p>
      </div>

      {/* Row 1: Analytics cards */}
      <div className="grid grid-cols-3 gap-6 items-stretch">
        <Card
          title="New Volunteers by Age"
          subtitle="Cohort breakdown by year"
          headerRight={<YearDropdown />}
        >
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.volunteersByAge}>
              <XAxis dataKey="age" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-3">
            <span className="text-sm text-slate-500">Total new recruits</span>
            <span className="text-lg font-bold text-slate-900">{stats.totalNewRecruits}</span>
          </div>
        </Card>

        <Card
          title="Conservation Impact"
          subtitle="Bird rescue & release outcomes"
          headerRight={<YearDropdown />}
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Released", value: stats.conservation.totalReleased },
                      { name: "Admitted to care", value: stats.conservation.totalRescued - stats.conservation.totalReleased },
                    ]}
                    dataKey="value"
                    innerRadius={36}
                    outerRadius={54}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill={GREEN} />
                    <Cell fill={BLUE} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-slate-900">{stats.conservation.percentReleased}%</span>
                <span className="text-[10px] text-slate-500">Released</span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Total Rescued</p>
                <p className="text-lg font-bold text-slate-900">{stats.conservation.totalRescued}</p>
                <LegendDot color={BLUE} label="Admitted to care" />
              </div>
              <div>
                <p className="text-slate-500 text-xs">Total Released</p>
                <p className="text-lg font-bold text-slate-900">{stats.conservation.totalReleased}</p>
                <LegendDot color={GREEN} label="Successfully released" />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Shift Distribution" subtitle="Morning vs afternoon coverage — 2026">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Morning", value: stats.shifts.morningCount },
                      { name: "Afternoon", value: stats.shifts.afternoonCount },
                    ]}
                    dataKey="value"
                    innerRadius={36}
                    outerRadius={54}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill={NAVY} />
                    <Cell fill={LIGHT_BLUE} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-slate-900">{stats.shifts.totalShifts}</span>
                <span className="text-[10px] text-slate-500">Total Shifts</span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <LegendDot color={NAVY} label="Morning" />
                <p className="text-lg font-bold text-slate-900">{stats.shifts.morningPercent}%</p>
                <p className="text-xs text-slate-500">{stats.shifts.morningCount} shifts</p>
              </div>
              <div>
                <LegendDot color={LIGHT_BLUE} label="Afternoon" />
                <p className="text-lg font-bold text-slate-900">{stats.shifts.afternoonPercent}%</p>
                <p className="text-xs text-slate-500">{stats.shifts.afternoonCount} shifts</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Operational cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
        <Card title="Today's Overview" subtitle="Sunday, 16 August 2026">
          <div className="space-y-3">
            {stats.todaysShifts.map((shift) => (
              <div
                key={shift.area}
                className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 text-sm">{shift.area}</p>
                    <StatusBadge status={shift.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {shift.time} · {shift.people}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline self-start">
            View full roster →
          </button>
        </Card>

        <Card title="Staff & Volunteer Training" subtitle="Active training sessions">
          <div className="space-y-3">
            {stats.trainingSessions.map((session) => (
              <div
                key={session.name}
                className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-4 py-3"
              >
                <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {session.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 text-sm truncate">{session.name}</p>
                    <StatusBadge status={session.status} />
                  </div>
                  <p className="text-xs text-slate-500">{session.trainer}</p>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        session.progress === 100 ? "bg-green-600" : "bg-blue-600"
                      }`}
                      style={{ width: `${session.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---- Reusable pieces ----

function Card({
  title,
  subtitle,
  headerRight,
  children,
}: {
  title: string;
  subtitle: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

function YearDropdown() {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState("2026");
  const years = ["2026", "2025", "2024"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2 py-1 transition-colors"
      >
        {year}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-20 bg-white border border-slate-200 rounded-md shadow-lg z-10 overflow-hidden">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => {
                setYear(y);
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${
                y === year ? "text-blue-700 font-medium" : "text-slate-600"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </p>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Confirmed" || status === "Completed"
      ? "bg-green-100 text-green-700"
      : status === "Pending" || status === "In Progress"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${styles}`}>
      {status}
    </span>
  );
}