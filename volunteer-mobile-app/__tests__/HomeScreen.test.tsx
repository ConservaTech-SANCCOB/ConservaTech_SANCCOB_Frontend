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
});
