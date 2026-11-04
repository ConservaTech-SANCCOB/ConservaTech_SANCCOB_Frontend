import type { Shift } from "./api/shifts";
import type { Roster } from "./api/roster";
import { isActiveAssignment } from "./assignment-status";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Turns one week's shifts and roster into what the Dashboard (and later the room screen) shows:
// every shift with its people and open spots, a summary per day, totals for the week, and
// today's shifts grouped by time slot. Pure functions only, so they're easy to test.
//</summary>
//---------------------------------------------------------------------------------------------------------------//

export type SlotKey = "morning" | "afternoon" | "fullday" | "other";

export const SLOT_ORDER: SlotKey[] = ["morning", "afternoon", "fullday", "other"];

export const SLOT_INFO: Record<SlotKey, { label: string; time: string }> = {
  morning: { label: "Morning", time: "08:00–13:00" },
  afternoon: { label: "Afternoon", time: "14:00–17:00" },
  fullday: { label: "Full day", time: "08:00–17:00" },
  other: { label: "Other times", time: "" },
};

// The three slots the backend accepts. Anything else lands in "other" so it still shows.
export function slotKey(timeSlot: string | null | undefined): SlotKey {
  switch ((timeSlot ?? "").replace(/\s/g, "")) {
    case "08:00-13:00":
      return "morning";
    case "14:00-17:00":
      return "afternoon";
    case "08:00-17:00":
      return "fullday";
    default:
      return "other";
  }
}

//-----------------------------------------------------------------------------------------------//
// Dates. Everything works on the local calendar day (YYYY-MM-DD), never through UTC,
// so a shift on Monday stays on Monday in South African time.
//-----------------------------------------------------------------------------------------------//

export function getMonday(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(d: Date, days: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// "2 to 8 November", or "26 October to 1 November" when the week crosses a month.
export function weekRangeLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const month = (d: Date) => d.toLocaleDateString("en-GB", { month: "long" });
  return monday.getMonth() === sunday.getMonth()
    ? `${monday.getDate()} to ${sunday.getDate()} ${month(sunday)}`
    : `${monday.getDate()} ${month(monday)} to ${sunday.getDate()} ${month(sunday)}`;
}

//-----------------------------------------------------------------------------------------------//
// Week model
//-----------------------------------------------------------------------------------------------//

export interface SpotPerson {
  assignmentId: number;
  userId: number;
  firstName: string;
  fullName: string;
}

export interface ShiftSpot {
  shiftId: number;
  date: string; // YYYY-MM-DD
  slot: SlotKey;
  location: string;
  capacity: number;
  people: SpotPerson[];
  open: number; // spots nobody has taken yet, never below 0
}

export interface SlotCount {
  filled: number;
  capacity: number;
}

export interface DaySummary {
  date: string;
  weekday: string; // "MON"
  dayName: string; // "Monday"
  dayOfMonth: number;
  isToday: boolean;
  morning: SlotCount; // full-day shifts count in both the morning and the afternoon
  afternoon: SlotCount;
  capacity: number;
  open: number;
}

export interface CentreWeek {
  monday: string;
  rosterStatus: string | null; // "Published", "Draft"... null when no roster exists yet
  spots: ShiftSpot[];
  days: DaySummary[];
  totalSpots: number;
  filledSpots: number;
  openSpots: number;
  neediestDay: DaySummary | null; // the day with the most open spots, if any are open
  today: { slot: SlotKey; spots: ShiftSpot[] }[]; // only slots that have shifts today
}

export function buildCentreWeek(
  monday: Date,
  shifts: Shift[],
  roster: Roster | null,
  now: Date = new Date()
): CentreWeek {
  const todayISO = toISODate(now);

  // People per shift. Only "Assigned" rows count: "Vacant" rows are placeholders and "Conflict"
  // rows are unresolved, so neither uses up capacity (same rule as the backend's counts).
  const peopleByShift = new Map<number, SpotPerson[]>();
  for (const a of roster?.assignments ?? []) {
    if (!isActiveAssignment(a.status)) continue;
  
    const firstName = a.firstName?.trim() || "Volunteer";
    const person: SpotPerson = {
      assignmentId: a.rosterAssignmentId,
      userId: a.userId,
      firstName,
      fullName: `${firstName} ${a.lastName?.trim() ?? ""}`.trim(),
    };
    peopleByShift.set(a.shiftId, [...(peopleByShift.get(a.shiftId) ?? []), person]);
  }

  const spots: ShiftSpot[] = shifts
    .map((s) => {
      const people = peopleByShift.get(s.shiftId) ?? [];
      const capacity = Math.max(0, s.capacity ?? 0);
      return {
        shiftId: s.shiftId,
        date: (s.shiftDate ?? "").slice(0, 10),
        slot: slotKey(s.timeSlot),
        location: s.location?.trim() || "Unnamed area",
        capacity,
        people,
        open: Math.max(0, capacity - people.length),
      };
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) ||
        a.location.localeCompare(b.location)
    );

  const days: DaySummary[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const iso = toISODate(date);
    const daySpots = spots.filter((s) => s.date === iso);
    const count = (keys: SlotKey[]): SlotCount =>
      daySpots
        .filter((s) => keys.includes(s.slot))
        .reduce(
          (sum, s) => ({
            filled: sum.filled + Math.min(s.people.length, s.capacity),
            capacity: sum.capacity + s.capacity,
          }),
          { filled: 0, capacity: 0 }
        );
    return {
      date: iso,
      weekday: date.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
      dayName: date.toLocaleDateString("en-GB", { weekday: "long" }),
      dayOfMonth: date.getDate(),
      isToday: iso === todayISO,
      morning: count(["morning", "fullday"]),
      afternoon: count(["afternoon", "fullday"]),
      capacity: daySpots.reduce((sum, s) => sum + s.capacity, 0),
      open: daySpots.reduce((sum, s) => sum + s.open, 0),
    };
  });

  const totalSpots = spots.reduce((sum, s) => sum + s.capacity, 0);
  const openSpots = spots.reduce((sum, s) => sum + s.open, 0);
  const neediestDay = days.reduce<DaySummary | null>(
    (best, d) => (d.open > 0 && (!best || d.open > best.open) ? d : best),
    null
  );

  const todaySpots = spots.filter((s) => s.date === todayISO);
  const today = SLOT_ORDER.map((slot) => ({ slot, spots: todaySpots.filter((s) => s.slot === slot) })).filter(
    (g) => g.spots.length > 0
  );

  return {
    monday: toISODate(monday),
    rosterStatus: roster?.status ?? null,
    spots,
    days,
    totalSpots,
    filledSpots: totalSpots - openSpots,
    openSpots,
    neediestDay,
    today,
  };
}

//-----------------------------------------------------------------------------------------------//
// Room screen
//-----------------------------------------------------------------------------------------------//

export const SLOT_START: Record<SlotKey, string> = { morning: "08:00", afternoon: "14:00", fullday: "08:00", other: "" };

export interface BoardRow {
  time: string; // "08:00"
  where: string; // "FOOD PREP"
  status: string; // "ALL SET" or "NEEDS 2", never longer than 7 letters
  allSet: boolean;
  spoken: string; // what a screen reader says for this row
}

export interface RoomBoard {
  part: "morning" | "afternoon" | "evening";
  rows: BoardRow[];
  crew: string[]; // first names on shift this part of the day, each once
  callout: string | null; // asks for help where the most hands are missing
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// What the volunteer room TV shows right now. The morning slot ends at 13:00, so from then on the
// board only shows what's still to come. First names only, because the TV is in a shared room.
//</summary>
//-----------------------------------------------------------------------------------------------//
export function buildRoomBoard(week: CentreWeek | null, now: Date = new Date()): RoomBoard {
  const hour = now.getHours();
  const part = hour < 13 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const today = week?.today.flatMap((g) => g.spots) ?? [];
  const showing = part === "afternoon" ? today.filter((s) => s.slot !== "morning") : today;

  const rows = showing.map((s) => {
    const status = s.open === 0 ? "ALL SET" : s.open < 10 ? `NEEDS ${s.open}` : `NEED ${s.open}`;
    return {
      time: SLOT_START[s.slot],
      where: s.location.toUpperCase(),
      status,
      allSet: s.open === 0,
      spoken: `${SLOT_START[s.slot]}, ${s.location}, ${s.open === 0 ? "all set" : `needs ${s.open} more`}`,
    };
  });

  const nowSlots: SlotKey[] =
    part === "morning" ? ["morning", "fullday"] : part === "afternoon" ? ["afternoon", "fullday"] : [];
  const crew = [
    ...new Set(today.filter((s) => nowSlots.includes(s.slot)).flatMap((s) => s.people.map((p) => p.firstName))),
  ];

  const neediest = (spots: ShiftSpot[]) =>
    spots.filter((s) => s.open > 0).sort((a, b) => b.open - a.open)[0];
  const hands = (n: number) => `${n} more ${n === 1 ? "hand" : "hands"}`;

  let callout: string | null = null;
  if (part === "morning") {
    const afternoon = neediest(today.filter((s) => s.slot === "afternoon"));
    const morning = neediest(today.filter((s) => s.slot === "morning" || s.slot === "fullday"));
    if (afternoon) callout = `Free this afternoon? ${afternoon.location} needs ${hands(afternoon.open)}. Ask at the desk.`;
    else if (morning) callout = `Can you stay a while? ${morning.location} needs ${hands(morning.open)}. Ask at the desk.`;
  } else if (part === "afternoon") {
    const afternoon = neediest(today.filter((s) => s.slot !== "morning"));
    if (afternoon) callout = `Got a moment? ${afternoon.location} needs ${hands(afternoon.open)} this afternoon. Ask at the desk.`;
  }

  return { part, rows, crew, callout };
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//