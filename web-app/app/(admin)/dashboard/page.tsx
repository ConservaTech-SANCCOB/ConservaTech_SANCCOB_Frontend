"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import { isUnauthorized } from "../../lib/api/http";
import {
  ConservationStats,
  fetchActiveTraining,
  fetchConservationImpact,
  fetchShiftDistribution,
  fetchTodaysOverview,
  fetchVolunteersByAge,
  ShiftDistribution,
  TodaysShift,
  TrainingVolunteerSummary,
  updateConservationImpact,
  VolunteersByAge,
} from "../../lib/api/dashboard";

const NAVY = "#0B2447";
const BLUE = "#2563EB";
const LIGHT_BLUE = "#60A5FA";
const GREEN = "#16A34A";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const MAX_TRAINING_ROWS = 5;

interface Section<T> {
  data: T | null;
  error: string;
  loaded: boolean;
}

/**
 * Loads one dashboard card's data. Each card loads on its own so one failing endpoint
 * only shows an error in that card instead of blanking the whole dashboard. A 401
 * logs out (the admin layout then redirects to login), matching the Volunteers page.
 */
function useSection<T>(load: (() => Promise<T>) | null, onUnauthorized: () => void) {
  const [state, setState] = useState<Section<T>>({ data: null, error: "", loaded: false });
  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    if (!load) return;
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setState({ data, error: "", loaded: true });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          onUnauthorizedRef.current();
          return;
        }
        setState({
          data: null,
          error: err instanceof Error ? err.message : "Something went wrong.",
          loaded: true,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return [state, setState] as const;
}

function initialsFor(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

function peopleLabel(names: string[] | null) {
  if (!names || names.length === 0) return "No volunteers assigned";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const [ageYear, setAgeYear] = useState(CURRENT_YEAR);
  const [conservationYear, setConservationYear] = useState(CURRENT_YEAR);

  const loadAge = useMemo(
    () => (token ? () => fetchVolunteersByAge(token, ageYear) : null),
    [token, ageYear]
  );
  const loadConservation = useMemo(
    () => (token ? () => fetchConservationImpact(token, conservationYear) : null),
    [token, conservationYear]
  );
  const loadShifts = useMemo(() => (token ? () => fetchShiftDistribution(token, CURRENT_YEAR) : null), [token]);
  const loadToday = useMemo(() => (token ? () => fetchTodaysOverview(token) : null), [token]);
  const loadTraining = useMemo(() => (token ? () => fetchActiveTraining(token) : null), [token]);

  const [age] = useSection<VolunteersByAge>(loadAge, logout);
  const [conservation, setConservation] = useSection<ConservationStats>(loadConservation, logout);
  const [shifts] = useSection<ShiftDistribution>(loadShifts, logout);
  const [today] = useSection<TodaysShift[]>(loadToday, logout);
  const [training] = useSection<TrainingVolunteerSummary[]>(loadTraining, logout);

  // Modal State for Editing Conservation Impact
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescuedInput, setRescuedInput] = useState("");
  const [releasedInput, setReleasedInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Handle Conservation Data Update
  const handleSaveConservationData = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    const rescued = parseInt(rescuedInput, 10);
    const released = parseInt(releasedInput, 10);

    if (isNaN(rescued) || isNaN(released)) {
      setModalError("Please enter valid numeric values.");
      return;
    }

    if (released > rescued) {
      setModalError("Released birds cannot exceed total rescued birds.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateConservationImpact(token, conservationYear, {
        totalRescued: rescued,
        totalReleased: released,
      });
      // Use the backend's saved figures; fall back to what was sent if it returns no body.
      setConservation({
        data: updated ?? {
          year: conservationYear,
          totalRescued: rescued,
          totalReleased: released,
          percentReleased: rescued > 0 ? (released / rescued) * 100 : 0,
        },
        error: "",
        loaded: true,
      });
      setIsModalOpen(false);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setModalError(err instanceof Error ? err.message : "Couldn't save conservation data.");
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = () => {
    setRescuedInput(conservation.data ? conservation.data.totalRescued.toString() : "");
    setReleasedInput(conservation.data ? conservation.data.totalReleased.toString() : "");
    setModalError("");
    setIsModalOpen(true);
  };

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-slate-100/80 p-6 min-h-screen rounded-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Cathy </h1>
        <p className="text-slate-500 mt-1">
          Here&apos;s what&apos;s happening at SANCCOB today.
        </p>
      </div>

      {/* Row 1: Analytics cards */}
      <div className="grid grid-cols-3 gap-6 items-stretch">
        <Card
          title="New Volunteers by Age"
          subtitle="Cohort breakdown by year"
          headerRight={<YearDropdown value={ageYear} onChange={setAgeYear} />}
        >
          <SectionBody section={age}>
            {(data) => (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.volunteersByAge}>
                    <XAxis dataKey="age" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-3">
                  <span className="text-sm text-slate-500">Total new recruits</span>
                  <span className="text-lg font-bold text-slate-900">{data.totalNewRecruits}</span>
                </div>
              </>
            )}
          </SectionBody>
        </Card>

        {/* Conservation Impact Card */}
        <Card
          title="Conservation Impact"
          subtitle="Bird rescue & release outcomes"
          headerRight={<YearDropdown value={conservationYear} onChange={setConservationYear} />}
        >
          <SectionBody section={conservation}>
            {(data) => (
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-28 h-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Released", value: data.totalReleased },
                          { name: "Admitted to care", value: Math.max(0, data.totalRescued - data.totalReleased) },
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
                    <span className="text-lg font-bold text-slate-900">{Math.round(data.percentReleased)}%</span>
                    <span className="text-[10px] text-slate-500">Released</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">Total Rescued</p>
                    <p className="text-lg font-bold text-slate-900">{data.totalRescued}</p>
                    <LegendDot color={BLUE} label="Admitted to care" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Total Released</p>
                    <p className="text-lg font-bold text-slate-900">{data.totalReleased}</p>
                    <LegendDot color={GREEN} label="Successfully released" />
                  </div>
                </div>
              </div>
            )}
          </SectionBody>

          {/* Edit Data Button positioned at Bottom Left */}
          <div className="pt-3 border-t border-slate-100 mt-3 flex justify-start">
            <button
              onClick={openModal}
              className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-2.5 py-1 transition-colors"
            >
              Edit Data
            </button>
          </div>
        </Card>

        <Card title="Shift Distribution" subtitle={`Morning vs afternoon coverage — ${CURRENT_YEAR}`}>
          <SectionBody section={shifts}>
            {(data) => (
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-28 h-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Morning", value: data.morningCount },
                          { name: "Afternoon", value: data.afternoonCount },
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
                    <span className="text-lg font-bold text-slate-900">{data.totalShifts}</span>
                    <span className="text-[10px] text-slate-500">Total Shifts</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <LegendDot color={NAVY} label="Morning" />
                    <p className="text-lg font-bold text-slate-900">{Math.round(data.morningPercent)}%</p>
                    <p className="text-xs text-slate-500">{data.morningCount} shifts</p>
                  </div>
                  <div>
                    <LegendDot color={LIGHT_BLUE} label="Afternoon" />
                    <p className="text-lg font-bold text-slate-900">{Math.round(data.afternoonPercent)}%</p>
                    <p className="text-xs text-slate-500">{data.afternoonCount} shifts</p>
                  </div>
                </div>
              </div>
            )}
          </SectionBody>
        </Card>
      </div>

      {/* Row 2: Operational cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
        <Card
          title="Today's Overview"
          subtitle={todayLabel}
          headerRight={<LinkHeader href="/roster" text="Full Roster" />}
        >
          <SectionBody section={today}>
            {(data) =>
              data.length === 0 ? (
                <EmptyNote text="No shifts are scheduled for today." />
              ) : (
                <div className="space-y-3">
                  {data.map((shift) => (
                    <div
                      key={shift.shiftId}
                      className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-4 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 text-sm">{shift.location ?? "Unassigned location"}</p>
                          {shift.status && <StatusBadge status={shift.status} />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {shift.timeSlot ?? "Time not set"} · {peopleLabel(shift.volunteerNames)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </SectionBody>
        </Card>

        <Card
          title="Staff & Volunteer Training"
          subtitle="Active training sessions"
          headerRight={<LinkHeader href="/training" text="Training Hub" />}
        >
          <SectionBody section={training}>
            {(data) =>
              data.length === 0 ? (
                <EmptyNote text="No volunteers are currently in training." />
              ) : (
                <div className="space-y-3">
                  {data.slice(0, MAX_TRAINING_ROWS).map((volunteer) => {
                    const progress = Math.min(100, Math.max(0, Math.round(volunteer.progressPercentage)));
                    const name =
                      `${volunteer.firstName ?? ""} ${volunteer.lastName ?? ""}`.trim() || "Unnamed volunteer";
                    return (
                      <div
                        key={volunteer.userId}
                        className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-4 py-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                          {initialsFor(volunteer.firstName, volunteer.lastName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 text-sm truncate">{name}</p>
                            {volunteer.trainingStatus && <StatusBadge status={volunteer.trainingStatus} />}
                          </div>
                          <p className="text-xs text-slate-500">
                            {volunteer.completedSkills} of {volunteer.totalRequiredSkills} skills signed off
                          </p>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5">
                            <div
                              className={`h-1.5 rounded-full ${progress === 100 ? "bg-green-600" : "bg-blue-600"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </SectionBody>
        </Card>
      </div>
      {/* Modal for Editing Conservation Data */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Update Conservation Data</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter the total rescued and released numbers for {conservationYear}.
              </p>
            </div>

            {modalError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {modalError}
              </p>
            )}

            <form onSubmit={handleSaveConservationData} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Total Birds Rescued
                </label>
                <input
                  type="number"
                  min="0"
                  value={rescuedInput}
                  onChange={(e) => setRescuedInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Total Birds Released
                </label>
                <input
                  type="number"
                  min="0"
                  value={releasedInput}
                  onChange={(e) => setReleasedInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

/** Shows a card's loading / error state, or its content once the data has arrived. */
function SectionBody<T>({
  section,
  children,
}: {
  section: Section<T>;
  children: (data: T) => React.ReactNode;
}) {
  if (!section.loaded) {
    return <p className="text-sm text-slate-500 py-8 text-center flex-1">Loading…</p>;
  }
  if (section.error || !section.data) {
    return (
      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 my-4">
        {section.error || "Something went wrong."}
      </p>
    );
  }
  return <>{children(section.data)}</>;
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-slate-500 py-6 text-center">{text}</p>;
}

function LinkHeader({ href, text }: { href: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
    >
      <span>{text}</span>
      <svg
        className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}

function YearDropdown({ value, onChange }: { value: number; onChange: (year: number) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2 py-1 transition-colors"
      >
        {value}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-20 bg-white border border-slate-200 rounded-md shadow-lg z-10 overflow-hidden">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => {
                onChange(y);
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${
                y === value ? "text-blue-700 font-medium" : "text-slate-600"
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
