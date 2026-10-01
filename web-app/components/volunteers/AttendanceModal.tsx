"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../app/lib/auth-context";
import { ApiError, isUnauthorized } from "../../app/lib/api/http";
import {
  fetchWeeklyRoster,
  fetchAttendanceForAssignment,
  updateAttendanceStatus,
  Roster,
  RosterAssignment,
} from "../../app/lib/api/roster";
import { Volunteer } from "../../app/lib/api/volunteers";

// IMPORTANT: never build "YYYY-MM-DD" with toISOString() for a local calendar
// day. It converts to UTC first, which in UTC+2 shifts local midnight back to
// the previous day. Build the string from the local date fields instead.
function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// Monday of the week containing `date`, as a local "YYYY-MM-DD" string.
function getMondayISO(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  d.setDate(d.getDate() - ((day + 6) % 7));
  return formatDateISO(d);
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`); // parsed as LOCAL midnight
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
}

function formatShiftDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Shape seen in a real GET /api/Attendance/{id} response:
// { rosterAssignmentId, attended, hoursWorked }. Parsed defensively so an
// unexpected response just shows "Not marked yet" instead of crashing.
interface AttendanceInfo {
  attended: boolean | null;
  hoursWorked: number | null;
}

function toAttendanceInfo(raw: unknown): AttendanceInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    attended: typeof r.attended === "boolean" ? r.attended : null,
    hoursWorked: typeof r.hoursWorked === "number" ? r.hoursWorked : null,
  };
}

export default function AttendanceModal({
  volunteer,
  onClose,
  onAttendanceChanged,
}: {
  volunteer: Volunteer;
  onClose: () => void;
  onAttendanceChanged: () => void;
}) {
  const { token, logout } = useAuth();
  // Computed per render (not at module load) so it stays right if the page
  // is left open across midnight or into a new week.
  const thisWeek = getMondayISO(new Date());
  const [weekStart, setWeekStart] = useState(thisWeek);
  const [roster, setRoster] = useState<Roster | null>(null);
  // Saved attendance per rosterAssignmentId. A missing key = not loaded yet;
  // null = loaded but nothing saved (or the lookup failed).
  const [attendance, setAttendance] = useState<Record<number, AttendanceInfo | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [weekHasNoRoster, setWeekHasNoRoster] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [savedMessage, setSavedMessage] = useState("");

  // `silent` reloads the data without swapping the list for the "Loading…"
  // state, so the list doesn't blink after every attendance click.
  const loadRoster = async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    setLoadError("");
    setWeekHasNoRoster(false);
    try {
      const data = await fetchWeeklyRoster(token, weekStart);
      setRoster(data);

      // The roster response has no attended field, so look up each of this
      // volunteer's shifts from the Attendance endpoint.
      const mine = (data.assignments ?? []).filter(
        (a) => String(a.userId) === volunteer.id
      );
      const entries = await Promise.all(
        mine.map(async (a) => {
          try {
            const res = await fetchAttendanceForAssignment(token, a.rosterAssignmentId);
            return [a.rosterAssignmentId, toAttendanceInfo(res)] as const;
          } catch (err) {
            if (isUnauthorized(err)) throw err;
            // Nothing saved yet (or lookup failed) -> treated as "Not marked yet".
            return [a.rosterAssignmentId, null] as const;
          }
        })
      );
      setAttendance(Object.fromEntries(entries));
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      // A week with no roster generated yet 404s — treat as empty state,
      // not an error (matches the Roster page's own handling).
      if (err instanceof ApiError && err.status === 404) {
        setRoster(null);
        setAttendance({});
        setWeekHasNoRoster(true);
      } else {
        console.error("Failed to load roster for attendance", err);
        setLoadError(
          err instanceof Error ? err.message : "Unable to load this week's roster."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSavedMessage("");
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, token]);

  // Same cross-reference rule used elsewhere: Volunteer.id is
  // String(userId ?? email); RosterAssignment.userId is a number.
  const myAssignments: RosterAssignment[] = (roster?.assignments ?? []).filter(
    (a) => String(a.userId) === volunteer.id
  );

  const handleMark = async (assignment: RosterAssignment, attended: boolean) => {
    if (!token) return;
    setUpdatingId(assignment.rosterAssignmentId);
    setSavedMessage("");
    try {
      await updateAttendanceStatus(token, assignment.rosterAssignmentId, attended);

      // Weekly Hours / Attendance Rate on the volunteers table are backend-
      // computed fields — tell the parent to re-fetch the volunteer list so
      // those columns pick up the change.
      onAttendanceChanged();
      await loadRoster(true);
      setSavedMessage(
        `${formatShiftDate(assignment.shiftDate)} marked as ${
          attended ? "attended" : "not attended"
        }.`
      );
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      console.error("Failed to update attendance", err);
      alert(err instanceof Error ? err.message : "Failed to update attendance status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Attendance</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-5">{volunteer.name}</p>

        {/* Week navigation */}
        <div className="flex items-center justify-between mb-4 bg-slate-50 rounded-xl px-3 py-2">
          <button
            onClick={() => setWeekStart((w) => addDaysISO(w, -7))}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-blue-600 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeftIcon />
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-700">
              {formatWeekLabel(weekStart)}
            </p>
            {weekStart !== thisWeek && (
              <button
                onClick={() => setWeekStart(thisWeek)}
                className="text-[10px] font-medium text-blue-600 hover:underline"
              >
                Back to this week
              </button>
            )}
          </div>
          <button
            onClick={() => setWeekStart((w) => addDaysISO(w, 7))}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-blue-600 transition-colors"
            aria-label="Next week"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {loadError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600"
          >
            <span>{loadError}</span>
            <button
              onClick={() => loadRoster()}
              className="shrink-0 px-3 py-1 rounded-lg bg-white border border-red-200 hover:bg-red-100 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {savedMessage && (
          <p className="mb-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {savedMessage}
          </p>
        )}

        {isLoading ? (
          <div className="py-10 text-center text-slate-400 text-sm font-medium">
            Loading shifts…
          </div>
        ) : weekHasNoRoster || myAssignments.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm font-medium">
            {weekHasNoRoster
              ? "No roster has been generated for this week."
              : "No shifts assigned to this volunteer this week."}
          </div>
        ) : (
          <div className="space-y-2">
            {myAssignments.map((a) => {
              const isUpdating = updatingId === a.rosterAssignmentId;
              const info = attendance[a.rosterAssignmentId] ?? null;
              const attended = info?.attended ?? null;
              return (
                <div
                  key={a.rosterAssignmentId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {formatShiftDate(a.shiftDate)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {a.timeSlot || "—"} · {a.location || "—"}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <AttendanceBadge attended={attended} />
                      {attended !== null && info?.hoursWorked != null && (
                        <span className="text-[11px] text-slate-500">
                          {info.hoursWorked} {info.hoursWorked === 1 ? "hr" : "hrs"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleMark(a, true)}
                      disabled={isUpdating}
                      className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all font-bold text-xs disabled:opacity-50 ${
                        attended === true
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                      }`}
                      title="Mark attended"
                      aria-label="Mark attended"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleMark(a, false)}
                      disabled={isUpdating}
                      className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all font-bold text-xs disabled:opacity-50 ${
                        attended === false
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white"
                      }`}
                      title="Mark not attended"
                      aria-label="Mark not attended"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceBadge({ attended }: { attended: boolean | null }) {
  if (attended === true) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        Attended
      </span>
    );
  }
  if (attended === false) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        Not attended
      </span>
    );
  }
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
      Not marked yet
    </span>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}