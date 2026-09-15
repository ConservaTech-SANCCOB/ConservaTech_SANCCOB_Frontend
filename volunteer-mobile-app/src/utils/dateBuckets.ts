export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
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
