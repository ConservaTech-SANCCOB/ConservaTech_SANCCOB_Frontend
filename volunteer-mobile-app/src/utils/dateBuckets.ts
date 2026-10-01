export function parseLocalDate(dateStr: string): Date {
  // Only the YYYY-MM-DD part: a "2026-09-28T00:00:00" datetime would otherwise parse
  // the day as NaN, fall back to the 1st, and make an upcoming shift look past.
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function getDiffDays(dateStr: string): number {
  const shiftDate = parseLocalDate(dateStr);
  shiftDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((shiftDate.getTime() - today.getTime()) / 86400000);
}

export type DateBucket = "Today" | "This Week" | "Later" | "Past";

export function bucketForDate(dateStr: string): DateBucket {
  const diffDays = getDiffDays(dateStr);
  if (diffDays < 0) return "Past";
  if (diffDays === 0) return "Today";
  if (diffDays <= 7) return "This Week";
  return "Later";
}

export function getRelativeLabel(dateStr: string): string {
  const diffDays = getDiffDays(dateStr);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

/**
 * Parses a backend date-time (e.g. a notification's `createdAt`). The server runs in UTC,
 * and .NET serialises a database DateTime without an offset ("2026-09-25T10:00:00"), which
 * `new Date` would read as local time — two hours off in South Africa. So a timestamp with
 * no zone is treated as UTC.
 */
export function parseBackendTimestamp(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Today, 14:05", "Yesterday, 09:30", "12 Sep, 14:05", or "12 Sep 2025, 14:05" in an earlier year. */
export function formatTimestamp(value: string): string | null {
  const date = parseBackendTimestamp(value);
  if (Number.isNaN(date.getTime())) return null;

  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000);

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  const year = date.getFullYear() === today.getFullYear() ? "" : ` ${date.getFullYear()}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}${year}, ${time}`;
}
