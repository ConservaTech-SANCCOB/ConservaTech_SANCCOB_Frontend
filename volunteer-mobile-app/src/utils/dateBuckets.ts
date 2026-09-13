export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export type DateBucket = "Today" | "This Week" | "Later" | "Past";

export function bucketForDate(dateStr: string): DateBucket {
  const shiftDate = parseLocalDate(dateStr);
  shiftDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((shiftDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "Past";
  if (diffDays === 0) return "Today";
  if (diffDays <= 7) return "This Week";
  return "Later";
}
