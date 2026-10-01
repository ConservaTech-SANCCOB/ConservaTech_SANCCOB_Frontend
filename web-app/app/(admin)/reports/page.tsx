"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../lib/auth-context";
import { fetchReportsData, ReportsData } from "../../lib/api/reports";

const NAVY = "#0B2447";
const BLUE = "#2563EB";
const LIGHT_BLUE = "#60A5FA";
const GREEN = "#16A34A";

export default function ReportsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const [year, setYear] = useState("2026");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError("");
        const result = await fetchReportsData(token, year, "");
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError("Couldn't load report data. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token, year]);

  const handleReset = () => {
    setYear("2026");
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    if (!data) return;
    setIsExportingExcel(true);
    try {
      const XLSX = await import("xlsx");

      const summaryRows = [
        ["SANCCOB Reports & Analytics"],
        [`Year: ${year}`],
        [],
        ["Metric", "Value"],
        ["Total Volunteer Hours", data.totalVolunteerHours],
        ["Avg Attendance Rate (%)", data.avgAttendanceRate],
        ["Missed Shifts", data.missedShifts],
        ["Active Volunteers", data.activeVolunteers],
        [],
        ["Conservation Impact"],
        ["Total Released", data.conservation.totalReleased],
        ["Total In Care", data.conservation.totalInCare],
        ["Percent Released (%)", data.conservation.percentReleased],
      ];

      const monthlyHoursRows = [
        ["Month", "Hours"],
        ...data.monthlyHours.map((m) => [m.month, m.hours]),
      ];

      const attendanceRows = [
        ["Month", "Attendance Rate (%)"],
        ...data.attendanceByMonth.map((a) => [a.month, a.rate]),
      ];

      const contributorRows = [
        ["Rank", "Name", "Hours"],
        ...data.topContributors.map((c, i) => [i + 1, c.name, c.hours]),
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "Summary");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlyHoursRows), "Monthly Hours");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(attendanceRows), "Attendance");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contributorRows), "Top Contributors");

      XLSX.writeFile(wb, `SANCCOB_Reports_${year}.xlsx`);
    } catch (err) {
      alert("Something went wrong generating the Excel file. Please try again.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Loading reports…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error || "Something went wrong."}
        </p>
      </div>
    );
  }

  const totalMonthlyHours = data.monthlyHours.reduce((sum, m) => sum + m.hours, 0);
  const maxContributorHours =
    data.topContributors.length > 0
      ? Math.max(...data.topContributors.map((c) => c.hours))
      : 1;

  return (
    <div className="bg-slate-100/80 p-6 min-h-screen rounded-2xl space-y-6">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report,
          #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Header — hidden when printing */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports &amp; Analytics</h1>
          <p className="text-slate-500 mt-1">
            Conservation impact and volunteer programme metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-slate-50 border border-blue-200 rounded-lg px-3 py-2 transition-colors"
          >
            <DownloadIcon />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon light />
            {isExportingExcel ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Filters — hidden when printing */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-500">
          <FilterIcon />
          <span className="text-xs font-medium">Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {/* Department filter removed — /api/admin/reports only supports filtering by year */}

        <button
          onClick={handleReset}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <RefreshIcon />
          Reset
        </button>
      </div>

      {/* Everything below is what actually prints/exports to PDF */}
      <div id="printable-report" className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            label="TOTAL VOLUNTEER HOURS"
            value={data.totalVolunteerHours.toLocaleString()}
            trend={`Jan–${year === "2026" ? "Aug" : "Dec"} ${year}`}
            trendUp
            icon={<ClockIcon />}
            iconBg="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="AVG ATTENDANCE RATE"
            value={`${data.avgAttendanceRate}%`}
            trend="Across all shifts"
            trendUp
            icon={<UserCheckIcon />}
            iconBg="bg-green-100 text-green-600"
          />
          <StatCard
            label="MISSED SHIFTS"
            value={data.missedShifts.toString()}
            trend={`Jan–${year === "2026" ? "Aug" : "Dec"} ${year}`}
            trendUp={false}
            icon={<AlertIcon />}
            iconBg="bg-red-100 text-red-600"
          />
          <StatCard
            label="ACTIVE VOLUNTEERS"
            value={data.activeVolunteers.toString()}
            trend="In programme"
            trendUp
            icon={<UsersIcon />}
            iconBg="bg-purple-100 text-purple-600"
          />
        </div>

        <div className="grid grid-cols-3 gap-6 items-stretch">
          <div className="col-span-2">
            <Card
              title="Monthly Volunteer Hours"
              subtitle={`Total hours logged per month — ${year}`}
              headerRight={
                <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
                  {totalMonthlyHours.toLocaleString()} hrs total
                </span>
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.monthlyHours}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 600]}
                    ticks={[0, 150, 300, 450, 600]}
                  />
                  <Tooltip />
                  <Line type="monotone" dataKey="hours" stroke={BLUE} strokeWidth={2.5} dot={{ r: 4, fill: BLUE }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="Conservation Impact" subtitle={`${year} bird outcomes`}>
            <div className="flex flex-col items-center flex-1 justify-center">
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Released", value: data.conservation.totalReleased },
                        { name: "In Care", value: data.conservation.totalInCare },
                      ]}
                      dataKey="value"
                      innerRadius={54}
                      outerRadius={76}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill={GREEN} />
                      <Cell fill={BLUE} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{data.conservation.percentReleased}%</span>
                  <span className="text-xs text-slate-500">Released</span>
                </div>
              </div>

              <div className="w-full mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <LegendDot color={GREEN} label="Released" />
                  <span className="font-semibold text-slate-900">{data.conservation.totalReleased}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <LegendDot color={BLUE} label="In Care" />
                  <span className="font-semibold text-slate-900">{data.conservation.totalInCare}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card title="Attendance Rate" subtitle={`Monthly volunteer attendance — ${year}`}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.attendanceByMonth}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[80, 100]}
                  ticks={[80, 85, 90, 95, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke={GREEN} strokeWidth={2.5} dot={{ r: 4, fill: GREEN }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title={`Top Contributors — ${year}`} subtitle="Volunteers with the most logged hours">
          <div className="space-y-3">
            {data.topContributors.length === 0 && (
              <p className="text-sm text-slate-400">No contributor data available yet.</p>
            )}
            {data.topContributors.map((contributor, index) => {
              const initial = contributor.name?.charAt(0)?.toUpperCase() ?? "?";
              const widthPercent = (contributor.hours / maxContributorHours) * 100;
              const isTop = index === 0;

              return (
                <div key={`${contributor.name}-${index}`} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400 w-4">{index + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${isTop ? "bg-green-600" : "bg-blue-600"}`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-16 text-right">
                    {contributor.hours} hrs
                  </span>
                  {isTop && <StarIcon />}
                </div>
              );
            })}
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
    <div className="bg-white rounded-2xl border-t border-l border-slate-200/80 border-b-4 border-r-2 border-slate-300 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all transform hover:-translate-y-0.5 p-5 h-full flex flex-col">
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

function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-500 tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className={`text-xs mt-1 flex items-center gap-1 ${trendUp ? "text-green-600" : "text-red-500"}`}>
        {trendUp ? <TrendUpIcon /> : <TrendDownIcon />}
        {trend}
      </p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <p className="flex items-center gap-1.5 text-slate-600">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </p>
  );
}

// ---- Inline icons ----

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function UserCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m17 11 2 2 4-4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m23 6-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m23 18-9.5-9.5-5 5L1 6" />
      <path d="M17 18h6v-6" />
    </svg>
  );
}

function DownloadIcon({ light = false }: { light?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={light ? "white" : "currentColor"} strokeWidth="2.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}