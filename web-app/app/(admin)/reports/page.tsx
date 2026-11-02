"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
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
import { useIsDark } from "../../lib/theme-context";
import { fetchReportsData, ReportsData } from "../../lib/api/reports";
import { card, buttonPrimary, buttonOutline } from "@/components/ui/styles";

//-----------------------------------------------------------------------------------------------//
//<summary>
// Colour constants used throughout the Reports & Analytics page. These are plain hex because
// recharts takes colour props directly, not Tailwind classes — they're kept in step with the
// brand/ok design tokens in globals.css (light values = :root, dark values = .dark).
// The *_DARK versions are lighter so the chart lines and slices stay visible on dark cards.
//</summary>
//-----------------------------------------------------------------------------------------------//
const BLUE = "#0B4A70";
const GREEN = "#2E9A1E";
const BLUE_DARK = "#7CC4F0";
const GREEN_DARK = "#4CB83A";

//-----------------------------------------------------------------------------------------------//
//<summary>
// Reports & Analytics page: displays volunteer and conservation reporting data for the selected year.
// Admins can view report metrics, charts and contributor information, and export the report to PDF or Excel.
//</summary>
//-----------------------------------------------------------------------------------------------//
export default function ReportsPage() {
//-----------------------------------------------------------------------------------------------//
//<summary>
// Authentication and page state used to load, display and export the report data.
// isPrinting is true only while the browser print dialog is open, so charts
// use their light colours on paper even when the app is in dark mode.
//</summary>
//-----------------------------------------------------------------------------------------------//
  const { token } = useAuth();
  const isDarkTheme = useIsDark();
  const [isPrinting, setIsPrinting] = useState(false);
  const isDark = isDarkTheme && !isPrinting;
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const [year, setYear] = useState("2026");

//-----------------------------------------------------------------------------------------------//
//<summary>
// Chart colours that Tailwind classes can't reach (recharts takes plain colour props).
// Light values match the design tokens exactly, so light mode is unchanged.
//</summary>
//-----------------------------------------------------------------------------------------------//
  const gridColor = isDark ? "#24394C" : "#e3e9ef";
  const tickColor = isDark ? "#a9bccd" : "#3f5468";
  const lineBlue = isDark ? BLUE_DARK : BLUE;
  const lineGreen = isDark ? GREEN_DARK : GREEN;
  const pieGapColor = isDark ? "#10202f" : "#ffffff";
  const tooltipContentStyle = isDark
    ? { backgroundColor: "#142838", border: "1px solid #24394c", borderRadius: 8, color: "#e6eef5" }
    : undefined;
  const tooltipLabelStyle = isDark ? { color: "#e6eef5" } : undefined;

//-----------------------------------------------------------------------------------------------//
//<summary>
// Keeps printing light. Just before the browser prints (Export PDF button or
// Ctrl+P), the "dark" class is taken off <html> and the charts switch to their
// light colours; afterwards both are put back. flushSync makes React repaint
// the charts before the print snapshot is taken.
//</summary>
//-----------------------------------------------------------------------------------------------//
  useEffect(() => {
    const root = document.documentElement;
    let wasDark = false;

    const handleBeforePrint = () => {
      wasDark = root.classList.contains("dark");
      root.classList.remove("dark");
      flushSync(() => setIsPrinting(true));
    };

    const handleAfterPrint = () => {
      if (wasDark) root.classList.add("dark");
      wasDark = false;
      setIsPrinting(false);
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  //-----------------------------------------------------------------------------------------------//
//<summary>
// Loads the report data whenever the authentication token or selected year changes.
//</summary>
//-----------------------------------------------------------------------------------------------//
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError("");
        const result = await fetchReportsData(token, year);
        if (!cancelled) setData(result);
      } catch {
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
  
//-----------------------------------------------------------------------------------------------//
//<summary>
// Resets the report filters back to the default year.
//</summary>
//-----------------------------------------------------------------------------------------------//
  const handleReset = () => {
    setYear("2026");
  };

//-----------------------------------------------------------------------------------------------//
//<summary>
// Prints the report using the browser print dialog, with the printable report styling applied.
//</summary>
//-----------------------------------------------------------------------------------------------//
  const handleExportPDF = () => {
    window.print();
  };

//-----------------------------------------------------------------------------------------------//
//<summary>
// Generates and downloads an Excel workbook containing the report summary, monthly hours, attendance and top contributors.
//</summary>
//-----------------------------------------------------------------------------------------------//
  const handleExportExcel = async () => {
    if (!data) return;
    setIsExportingExcel(true);
    try {
      const XLSX = await import("xlsx");

      const inCare = data.conservation.totalRescued - data.conservation.totalReleased;

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
        ["Total Rescued", data.conservation.totalRescued],
        ["Total Released", data.conservation.totalReleased],
        ["Total In Care", inCare],
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
    } catch {
      alert("Something went wrong generating the Excel file. Please try again.");
    } finally {
      setIsExportingExcel(false);
    }
  };

//-----------------------------------------------------------------------------------------------//
//<summary>
// Displays a loading message while report data is being retrieved.
//</summary>
//-----------------------------------------------------------------------------------------------//
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-ink-faint text-sm font-semibold">Loading reports…</p>
      </div>
    );
  }

//-----------------------------------------------------------------------------------------------//
//<summary>
// Displays an error message when report data cannot be loaded.
//</summary>
//-----------------------------------------------------------------------------------------------//
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm font-bold text-urgent-ink bg-urgent border border-urgent-line rounded-2xl px-4 py-3">
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

  const totalInCare = data.conservation.totalRescued - data.conservation.totalReleased;

  return (
    <div className="bg-surface-sunken p-6 min-h-screen rounded-3xl space-y-6">
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

      {/*------------------------------------ Page header: title and report export buttons ----------------------------------------------------*/}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink-strong">Reports &amp; Analytics</h1>
          <p className="text-ink-muted mt-1">
            Conservation impact and volunteer programme metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} className={buttonOutline}>
            <DownloadIcon />
            Export PDF
          </button>
          <button onClick={handleExportExcel} disabled={isExportingExcel} className={buttonPrimary}>
            <DownloadIcon light />
            {isExportingExcel ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </div>

      {/*------------------------------------ Report filters ----------------------------------------------------*/}
      <div className={`${card} px-5 py-3 flex items-center gap-4`}>
        <div className="flex items-center gap-1.5 text-ink-muted">
          <FilterIcon />
          <span className="text-xs font-bold">Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-xs font-bold text-ink bg-surface-muted border border-line rounded-md px-2 py-1.5 focus:outline-none focus:ring-4 focus:ring-focus/20 focus:border-focus"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {/* Department filter removed — /api/admin/reports only supports filtering by year */}

        <button
          onClick={handleReset}
          className="ml-auto flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink-strong transition-colors"
        >
          <RefreshIcon />
          Reset
        </button>
      </div>

      {/*------------------------------------ Printable report ----------------------------------------------------*/}
      <div id="printable-report" className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            label="TOTAL VOLUNTEER HOURS"
            value={data.totalVolunteerHours.toLocaleString()}
            trend={`Jan–${year === "2026" ? "Aug" : "Dec"} ${year}`}
            trendUp
            icon={<ClockIcon />}
            iconBg="bg-tint text-brand"
          />
          <StatCard
            label="AVG ATTENDANCE RATE"
            value={`${data.avgAttendanceRate}%`}
            trend="Across all shifts"
            trendUp
            icon={<UserCheckIcon />}
            iconBg="bg-ok text-ok-ink"
          />
          <StatCard
            label="MISSED SHIFTS"
            value={data.missedShifts.toString()}
            trend={`Jan–${year === "2026" ? "Aug" : "Dec"} ${year}`}
            trendUp={false}
            icon={<AlertIcon />}
            iconBg="bg-urgent text-urgent-ink"
          />
          <StatCard
            label="ACTIVE VOLUNTEERS"
            value={data.activeVolunteers.toString()}
            trend="In programme"
            trendUp
            icon={<UsersIcon />}
            iconBg="bg-surface-muted text-ink-strong"
          />
        </div>

        <div className="grid grid-cols-3 gap-6 items-stretch">
          <div className="col-span-2">
            <Card
              title="Monthly Volunteer Hours"
              subtitle={`Total hours logged per month — ${year}`}
              headerRight={
                <span className="text-xs font-bold text-brand bg-tint border border-line rounded-full px-2.5 py-1">
                  {totalMonthlyHours.toLocaleString()} hrs total
                </span>
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.monthlyHours}>
                  <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: tickColor }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 600]}
                    ticks={[0, 150, 300, 450, 600]}
                  />
                  <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                  <Line type="monotone" dataKey="hours" stroke={lineBlue} strokeWidth={2.5} dot={{ r: 4, fill: lineBlue }} />
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
                        { name: "In Care", value: totalInCare },
                      ]}
                      dataKey="value"
                      innerRadius={54}
                      outerRadius={76}
                      startAngle={90}
                      endAngle={-270}
                      stroke={pieGapColor}
                    >
                      <Cell fill={lineGreen} />
                      <Cell fill={lineBlue} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-ink-strong">{data.conservation.percentReleased}%</span>
                  <span className="text-xs text-ink-muted">Released</span>
                </div>
              </div>

              <div className="w-full mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <LegendDot color={lineGreen} label="Released" />
                  <span className="font-bold text-ink-strong">{data.conservation.totalReleased}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <LegendDot color={lineBlue} label="In Care" />
                  <span className="font-bold text-ink-strong">{totalInCare}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-line-soft">
                  <span className="text-ink-muted">Total Rescued</span>
                  <span className="font-bold text-ink-strong">{data.conservation.totalRescued}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card title="Attendance Rate" subtitle={`Monthly volunteer attendance — ${year}`}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.attendanceByMonth}>
                <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  domain={[80, 100]}
                  ticks={[80, 85, 90, 95, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Line type="monotone" dataKey="rate" stroke={lineGreen} strokeWidth={2.5} dot={{ r: 4, fill: lineGreen }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title={`Top Contributors — ${year}`} subtitle="Volunteers with the most logged hours">
          <div className="space-y-3">
            {data.topContributors.length === 0 && (
              <p className="text-sm text-ink-faint">No contributor data available yet.</p>
            )}
            {data.topContributors.map((contributor, index) => {
              const initial = contributor.name?.charAt(0)?.toUpperCase() ?? "?";
              const widthPercent = (contributor.hours / maxContributorHours) * 100;
              const isTop = index === 0;

              return (
                <div key={`${contributor.name}-${index}`} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-ink-faint w-4">{index + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-brand text-brand-ink flex items-center justify-center text-xs font-black shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-surface-sunken rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${isTop ? "bg-ok-bar" : "bg-brand"}`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-ink-strong w-16 text-right">
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

//-----------------------------------------------------------------------------------------------//
//<summary>
// Reusable report card component used to keep the dashboard report sections visually consistent.
//</summary>
//-----------------------------------------------------------------------------------------------//
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
    <div className={`${card} shadow-sm p-5 h-full flex flex-col`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-extrabold text-ink-strong text-sm">{title}</h2>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Reusable statistics card for displaying a report metric, value, trend and icon.
//</summary>
//-----------------------------------------------------------------------------------------------//
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
    <div className={`${card} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-extrabold text-ink-muted tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p className="text-3xl font-black text-ink-strong">{value}</p>
      <p className={`text-xs mt-1 flex items-center gap-1 font-semibold ${trendUp ? "text-ok-ink" : "text-urgent-ink"}`}>
        {trendUp ? <TrendUpIcon /> : <TrendDownIcon />}
        {trend}
      </p>
    </div>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Small legend item used by the Conservation Impact chart.
//</summary>
//-----------------------------------------------------------------------------------------------//
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <p className="flex items-center gap-1.5 text-ink-muted">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </p>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Inline SVG icons used throughout the Reports & Analytics page.
//</summary>
//-----------------------------------------------------------------------------------------------//
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={light ? "currentColor" : "currentColor"} strokeWidth="2.5">
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

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//