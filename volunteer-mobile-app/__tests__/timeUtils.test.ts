import { parseLocalDate } from "../src/utils/dateBuckets";
import { hasShiftEnded } from "../src/utils/timeSlot";

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 25, 12, 0, 0) });
});
afterEach(() => {
  jest.useRealTimers();
});

describe("timeSlot", () => {
  it("treats a shift as ended only once its end time has passed", () => {
    expect(hasShiftEnded("2026-09-25", "08:00-12:00")).toBe(true);
    expect(hasShiftEnded("2026-09-25", "14:00-17:00")).toBe(false);
    expect(hasShiftEnded("2026-09-24", "Morning")).toBe(true);
    expect(hasShiftEnded("2026-09-25", "Morning")).toBe(false);
  });
});

describe("dateBuckets", () => {
  it("parses YYYY-MM-DD and full datetimes as local dates, not UTC", () => {
    const date = parseLocalDate("2026-09-25");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 25]);

    const dateTime = parseLocalDate("2026-09-28T00:00:00");
    expect([dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate()]).toEqual([2026, 8, 28]);
  });
});
