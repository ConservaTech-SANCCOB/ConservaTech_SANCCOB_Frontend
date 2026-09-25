import { AGE_BRACKETS, isAgeBracket } from "../src/constants/ageBrackets";
import { bucketForDate, getRelativeLabel, parseLocalDate } from "../src/utils/dateBuckets";
import { compareShiftsByStart, formatTimeSlotLabel, getTimeSlotHours, hasShiftEnded } from "../src/utils/timeSlot";

// Fixed "now": Thursday 25 Sept 2026, 12:00 local time.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 25, 12, 0, 0) });
});
afterEach(() => {
  jest.useRealTimers();
});

describe("timeSlot", () => {
  it("labels the shift blocks the backend accepts", () => {
    expect(formatTimeSlotLabel("08:00-13:00")).toBe("Morning");
    expect(formatTimeSlotLabel("14:00-17:00")).toBe("Afternoon");
    expect(formatTimeSlotLabel("08:00-17:00")).toBe("Full Day");
    expect(formatTimeSlotLabel("09:00-10:00")).toBe("09:00-10:00");
  });

  it("computes block length in hours", () => {
    expect(getTimeSlotHours("08:00-13:00")).toBe(5);
    expect(getTimeSlotHours("14:00-17:00")).toBe(3);
    expect(getTimeSlotHours("08:30-09:00")).toBe(0.5);
    expect(getTimeSlotHours("Morning")).toBe(0);
  });

  it("treats a shift as ended only once its end time has passed", () => {
    expect(hasShiftEnded("2026-09-25", "08:00-12:00")).toBe(true);
    expect(hasShiftEnded("2026-09-25", "14:00-17:00")).toBe(false);
    expect(hasShiftEnded("2026-09-24", "Morning")).toBe(true);
    expect(hasShiftEnded("2026-09-25", "Morning")).toBe(false);
  });

  it("orders shifts by date, then by start time within a day", () => {
    const shifts = [
      { shiftDate: "2026-09-27", timeSlot: "08:00-13:00" },
      { shiftDate: "2026-09-26", timeSlot: "14:00-17:00" },
      { shiftDate: "2026-09-26", timeSlot: "08:00-13:00" },
    ];
    expect([...shifts].sort(compareShiftsByStart)).toEqual([
      { shiftDate: "2026-09-26", timeSlot: "08:00-13:00" },
      { shiftDate: "2026-09-26", timeSlot: "14:00-17:00" },
      { shiftDate: "2026-09-27", timeSlot: "08:00-13:00" },
    ]);
  });
});

describe("dateBuckets", () => {
  it("parses YYYY-MM-DD as a local date, not UTC", () => {
    const date = parseLocalDate("2026-09-25");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 25]);
  });

  it("accepts a full datetime too, instead of silently falling back to the 1st", () => {
    const date = parseLocalDate("2026-09-28T00:00:00");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 28]);
    expect(bucketForDate("2026-09-28T00:00:00")).toBe("This Week");
  });

  it("buckets dates relative to today", () => {
    expect(bucketForDate("2026-09-24")).toBe("Past");
    expect(bucketForDate("2026-09-25")).toBe("Today");
    expect(bucketForDate("2026-10-02")).toBe("This Week");
    expect(bucketForDate("2026-10-03")).toBe("Later");
  });

  it("gives human relative labels", () => {
    expect(getRelativeLabel("2026-09-26")).toBe("Tomorrow");
    expect(getRelativeLabel("2026-09-24")).toBe("Yesterday");
    expect(getRelativeLabel("2026-09-28")).toBe("In 3 days");
    expect(getRelativeLabel("2026-09-20")).toBe("5 days ago");
  });
});

describe("ageBrackets", () => {
  it("matches the backend's accepted list exactly", () => {
    expect(AGE_BRACKETS).toEqual(["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]);
  });

  it("rejects anything outside that list", () => {
    expect(isAgeBracket("25-34")).toBe(true);
    expect(isAgeBracket("25 - 34")).toBe(false);
    expect(isAgeBracket("30")).toBe(false);
    expect(isAgeBracket(null)).toBe(false);
  });
});
