import { buildCentreWeek, buildRoomBoard, getMonday, slotKey, weekRangeLabel } from "../app/lib/centre-week";
import type { Shift } from "../app/lib/api/shifts";
import type { Roster, RosterAssignment } from "../app/lib/api/roster";

//--------------------HELPERS--------------------//

// Week of Monday 2 to Sunday 8 November 2026, "now" is Monday morning.
const MONDAY = new Date(2026, 10, 2);
const NOW = new Date(2026, 10, 2, 9, 30);

function shift(shiftId: number, shiftDate: string, timeSlot: string, location: string, capacity: number): Shift {
  return { shiftId, shiftDate, timeSlot, location, capacity };
}

function assignment(id: number, shiftId: number, firstName: string, status: string | null = "Assigned"): RosterAssignment {
  return {
    rosterAssignmentId: id,
    rosterId: 1,
    shiftId,
    userId: 100 + id,
    firstName,
    lastName: "Test",
    shiftDate: "",
    timeSlot: null,
    location: null,
    status,
  };
}

function roster(assignments: RosterAssignment[], status = "Published"): Roster {
  return { rosterId: 1, weekStartDate: "2026-11-02", weekEndDate: "2026-11-08", status, generatedAt: null, assignments };
}

const SHIFTS = [
  shift(1, "2026-11-02T00:00:00", "08:00-13:00", "Laundry", 2),
  shift(2, "2026-11-02", "14:00-17:00", "Quarantine", 1),
  shift(3, "2026-11-02", "08:00-17:00", "Food prep", 2),
  shift(4, "2026-11-04", "08:00-13:00", "Home pen", 3),
];

//--------------------TESTS--------------------//

describe("centre week helpers", () => {
  it("reads the three backend time slots and keeps anything else as other", () => {
    expect(slotKey("08:00-13:00")).toBe("morning");
    expect(slotKey("14:00 - 17:00")).toBe("afternoon");
    expect(slotKey("08:00-17:00")).toBe("fullday");
    expect(slotKey("10:00-12:00")).toBe("other");
    expect(slotKey(null)).toBe("other");
  });

  it("finds the Monday of any day, including Sunday", () => {
    expect(getMonday(new Date(2026, 10, 8, 15)).getDate()).toBe(2);
    expect(getMonday(new Date(2026, 10, 4)).getDate()).toBe(2);
  });

  it("labels a week, and names both months when it crosses one", () => {
    expect(weekRangeLabel(MONDAY)).toBe("2 to 8 November");
    expect(weekRangeLabel(new Date(2026, 9, 26))).toBe("26 October to 1 November");
  });

  it("counts filled and open spots, and ignores vacant placeholder rows", () => {
    const week = buildCentreWeek(
      MONDAY,
      SHIFTS,
      roster([
        assignment(1, 1, "Aisha"),
        assignment(2, 1, "Jonas"),
        assignment(3, 3, "Lerato"),
        assignment(4, 4, "Megan"),
        assignment(5, 4, "", "Vacant"),
      ]),
      NOW
    );

    expect(week.totalSpots).toBe(8);
    expect(week.filledSpots).toBe(4);
    expect(week.openSpots).toBe(4);
    expect(week.rosterStatus).toBe("Published");

    const laundry = week.spots.find((s) => s.shiftId === 1)!;
    expect(laundry.people.map((p) => p.firstName)).toEqual(["Aisha", "Jonas"]);
    expect(laundry.open).toBe(0);
    expect(week.spots.find((s) => s.shiftId === 4)!.open).toBe(2);
  });

  it("summarises each day, counting a full-day shift in both the morning and the afternoon", () => {
    const week = buildCentreWeek(
      MONDAY,
      SHIFTS,
      roster([assignment(1, 1, "Aisha"), assignment(2, 1, "Jonas"), assignment(3, 3, "Lerato")]),
      NOW
    );
    const monday = week.days[0];

    expect(week.days).toHaveLength(7);
    expect(monday).toMatchObject({ weekday: "MON", dayOfMonth: 2, isToday: true, capacity: 5, open: 2 });
    expect(monday.morning).toEqual({ filled: 3, capacity: 4 });
    expect(monday.afternoon).toEqual({ filled: 1, capacity: 3 });
    expect(week.days[6]).toMatchObject({ weekday: "SUN", capacity: 0, open: 0, isToday: false });
    expect(week.neediestDay?.dayName).toBe("Wednesday");
  });

  it("groups today's shifts by slot in the order morning, afternoon, full day", () => {
    const week = buildCentreWeek(MONDAY, SHIFTS, null, NOW);

    expect(week.today.map((g) => g.slot)).toEqual(["morning", "afternoon", "fullday"]);
    expect(week.today[0].spots.map((s) => s.location)).toEqual(["Laundry"]);
    expect(week.rosterStatus).toBeNull();
    expect(week.filledSpots).toBe(0);
  });

  it("never reports negative open spots when a shift has more people than places", () => {
    const week = buildCentreWeek(
      MONDAY,
      [shift(2, "2026-11-02", "14:00-17:00", "Quarantine", 1)],
      roster([assignment(1, 2, "Ruan"), assignment(2, 2, "Priya")]),
      NOW
    );

    expect(week.spots[0].open).toBe(0);
    expect(week.filledSpots).toBe(1);
    expect(week.neediestDay).toBeNull();
  });
});

describe("room screen board", () => {
  const ROSTER = roster([
    assignment(1, 1, "Aisha"),
    assignment(2, 1, "Jonas"),
    assignment(3, 3, "Lerato"),
    assignment(4, 2, "Aisha"),
  ]);

  it("in the morning shows every shift today, the morning crew once each, and asks for afternoon help", () => {
    const morning = new Date(2026, 10, 2, 9, 30);
    const board = buildRoomBoard(buildCentreWeek(MONDAY, SHIFTS, ROSTER, morning), morning);

    expect(board.part).toBe("morning");
    expect(board.rows.map((r) => [r.time, r.where, r.status])).toEqual([
      ["08:00", "LAUNDRY", "ALL SET"],
      ["14:00", "QUARANTINE", "ALL SET"],
      ["08:00", "FOOD PREP", "NEEDS 1"],
    ]);
    expect(board.crew).toEqual(["Aisha", "Jonas", "Lerato"]);
    expect(board.callout).toBe("Can you stay a while? Food prep needs 1 more hand. Ask at the desk.");
  });

  it("after 13:00 drops the morning shifts and lists the afternoon crew", () => {
    const afternoon = new Date(2026, 10, 2, 14, 5);
    const board = buildRoomBoard(buildCentreWeek(MONDAY, SHIFTS, roster([assignment(4, 2, "Ruan")]), afternoon), afternoon);

    expect(board.part).toBe("afternoon");
    expect(board.rows.map((r) => r.where)).toEqual(["QUARANTINE", "FOOD PREP"]);
    expect(board.crew).toEqual(["Ruan"]);
    expect(board.callout).toBe("Got a moment? Food prep needs 2 more hands this afternoon. Ask at the desk.");
  });

  it("keeps the status to 7 letters and shows nothing when the week isn't loaded", () => {
    const morning = new Date(2026, 10, 2, 8, 0);
    const big = buildCentreWeek(MONDAY, [shift(9, "2026-11-02", "08:00-13:00", "Beach clean-up", 12)], null, morning);

    expect(buildRoomBoard(big, morning).rows[0].status).toBe("NEED 12");
    expect(buildRoomBoard(null, morning)).toEqual({ part: "morning", rows: [], crew: [], callout: null });
  });
});

//----------------------------------- END OF FILE ---------------------------------//