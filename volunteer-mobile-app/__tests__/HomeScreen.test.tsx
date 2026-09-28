import { render, screen } from "@testing-library/react-native";
import HomeScreen from "../src/app/(tabs)/home/index";
import { getPendingCancellationIds } from "../src/services/changeRequests";
import { getMyNotifications } from "../src/services/notifications";
import { getMyProfile } from "../src/services/profile";
import { getMyShifts, MyShift } from "../src/services/shifts";

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    router: { replace: jest.fn() },
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
  };
});
jest.mock("../src/services/shifts");
jest.mock("../src/services/changeRequests");
jest.mock("../src/services/notifications");
jest.mock("../src/services/profile");

const mockedGetMyShifts = jest.mocked(getMyShifts);

// Fixed "now": Friday 25 Sept 2026, 12:00 local. advanceTimers keeps animations running.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 25, 12, 0, 0), advanceTimers: true });
  jest.clearAllMocks();
  jest.mocked(getPendingCancellationIds).mockResolvedValue(new Set());
  jest.mocked(getMyNotifications).mockResolvedValue([]);
  jest.mocked(getMyProfile).mockResolvedValue({
    firstName: "Sam",
    lastName: "Volunteer",
    email: "sam@example.com",
    phoneNumber: null,
    nationality: null,
    ageBracket: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
  });
});
afterEach(() => {
  jest.useRealTimers();
});

let nextId = 1;
function shift(shiftDate: string, timeSlot: string, location: string): MyShift {
  const id = nextId++;
  return { rosterAssignmentId: id, shiftId: id, status: "Assigned", shiftDate, timeSlot, location };
}

describe("Home — this week's shifts", () => {
  it("hides a shift from earlier today that has already ended", async () => {
    mockedGetMyShifts.mockResolvedValue([
      shift("2026-09-25", "08:00-11:00", "Early Pen"),
      shift("2026-09-25", "14:00-17:00", "Afternoon Pool"),
    ]);

    await render(<HomeScreen />);

    expect(await screen.findByText("Afternoon Pool")).toBeOnTheScreen();
    expect(screen.queryByText("Early Pen")).toBeNull();
  });

  it("shows the two soonest shifts, not whatever order the API sent", async () => {
    mockedGetMyShifts.mockResolvedValue([
      shift("2026-09-29", "08:00-13:00", "Next Week Clinic"),
      shift("2026-09-26", "14:00-17:00", "Saturday Afternoon"),
      shift("2026-09-26", "08:00-13:00", "Saturday Morning"),
    ]);

    await render(<HomeScreen />);

    expect(await screen.findByText("Saturday Morning")).toBeOnTheScreen();
    expect(screen.getByText("Saturday Afternoon")).toBeOnTheScreen();
    expect(screen.queryByText("Next Week Clinic")).toBeNull();
  });

  it("points to the next shift when there's none this week, instead of saying 'No shifts yet'", async () => {
    mockedGetMyShifts.mockResolvedValue([shift("2026-10-05", "08:00-13:00", "Rehab Pool")]);

    await render(<HomeScreen />);

    expect(await screen.findByText("No shifts this week")).toBeOnTheScreen();
    expect(screen.getByText(/Your next shift is in 10 days/)).toBeOnTheScreen();
    expect(screen.queryByText("No shifts yet")).toBeNull();
  });

  it("only shows the notification badge when something is unread", async () => {
    mockedGetMyShifts.mockResolvedValue([]);
    jest.mocked(getMyNotifications).mockResolvedValue([
      { notificationId: 1, message: "Shift assigned", type: "Assignment", isRead: false },
      { notificationId: 2, message: "Reminder", type: "Reminder", isRead: true },
    ]);

    await render(<HomeScreen />);

    expect(await screen.findByText("1")).toBeOnTheScreen();
  });

  it("hides the notification badge when everything is read", async () => {
    mockedGetMyShifts.mockResolvedValue([]);
    await render(<HomeScreen />);
    await screen.findByText("No shifts yet");
    expect(screen.queryByText("0")).toBeNull();
  });

  it("says 'No shifts yet' only when there are genuinely none ahead", async () => {
    mockedGetMyShifts.mockResolvedValue([shift("2026-09-20", "08:00-13:00", "Last Week")]);

    await render(<HomeScreen />);

    expect(await screen.findByText("No shifts yet")).toBeOnTheScreen();
  });
});
