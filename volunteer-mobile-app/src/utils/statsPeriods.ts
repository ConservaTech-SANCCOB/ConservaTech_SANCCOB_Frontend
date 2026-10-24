export type StatPeriod = "week" | "month" | "year";

export interface PeriodBucket {
  start: Date;
  end: Date;
  label: string;
  spoken: string;
}

export interface DatedValue {
  date: Date;
  value: number;
}

export const PERIOD_PHRASE: Record<StatPeriod, string> = {
  week: "this week",
  month: "this month",
  year: "in the last 12 months",
};

export const PREVIOUS_PHRASE: Record<StatPeriod, string> = {
  week: "last week",
  month: "last month",
  year: "the 12 months before",
};

// ------------------------------------------------------------ //

// Whole numbers show without a decimal but half hours stay
export function formatStat(value: number): string {
  return String(Number(value.toFixed(1)));
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  // Weeks start on Monday
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ------------------------------------------------------------ //

export function periodBuckets(period: StatPeriod, now = new Date()): PeriodBucket[] {
  if (period === "week") {
    const monday = startOfWeek(now);
    return Array.from({ length: 7 }, (_, i) => {
      const start = addDays(monday, i);
      return {
        start,
        end: addDays(start, 1),
        label: start.toLocaleDateString("en-GB", { weekday: "short" }),
        spoken: `on ${start.toLocaleDateString("en-GB", { weekday: "long" })}`,
      };
    });
  }

  if (period === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const starts = [first];
    for (let day = addDays(startOfWeek(first), 7); day < next; day = addDays(day, 7)) starts.push(day);
    return starts.map((start, i) => ({
      start,
      end: starts[i + 1] ?? next,
      label: start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      spoken: `in week ${i + 1}, starting ${start.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`,
    }));
  }

  return Array.from({ length: 12 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      start,
      end: new Date(start.getFullYear(), start.getMonth() + 1, 1),
      label: start.toLocaleDateString("en-GB", { month: "short" }),
      spoken: `in ${start.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
    };
  });
}

export function previousRange(period: StatPeriod, buckets: PeriodBucket[]): { start: Date; end: Date } {
  const start = buckets[0].start;
  if (period === "week") return { start: addDays(start, -7), end: start };
  if (period === "month") return { start: new Date(start.getFullYear(), start.getMonth() - 1, 1), end: start };
  return { start: new Date(start.getFullYear(), start.getMonth() - 12, 1), end: start };
}

// ------------------------------------------------------------ //

export function sumBetween(points: DatedValue[], start: Date, end: Date): number {
  return points.reduce((sum, p) => (p.date >= start && p.date < end ? sum + p.value : sum), 0);
}

export function bucketTotals(points: DatedValue[], buckets: PeriodBucket[]): number[] {
  return buckets.map((b) => sumBetween(points, b.start, b.end));
}

// Running totals stop at today
export function cumulativeTotals(points: DatedValue[], buckets: PeriodBucket[], now = new Date()): (number | null)[] {
  return buckets.map((b) => {
    if (b.start > now) return null;
    return points.reduce((sum, p) => (p.date < b.end ? sum + p.value : sum), 0);
  });
}

export function describeChange(diff: number, unit: string, period: StatPeriod): string {
  if (diff === 0) return `Same as ${PREVIOUS_PHRASE[period]}`;
  return `${diff > 0 ? "+" : "−"}${formatStat(Math.abs(diff))}${unit} vs ${PREVIOUS_PHRASE[period]}`;
}

//----------------------------------- END OF FILE ---------------------------------//
