import { render, screen } from "@testing-library/react-native";
import HoursWorkedScreen from "../src/app/(tabs)/progress/hours";
import { getMyTrainingStats } from "../src/services/training";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));
jest.mock("../src/services/training");

const mockedGetStats = jest.mocked(getMyTrainingStats);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Hours / Volunteering Stats", () => {
  it("shows the backend's totals and each shift's real hours worked", async () => {
    mockedGetStats.mockResolvedValue({
      totalHours: 12.5,
      shiftsCompleted: 3,
      hoursThisMonth: 4.5,
      completedShifts: [
        { shiftDate: "2026-08-14", timeSlot: "08:00-17:00", location: "Rehab Pool", hoursWorked: 8 },
        { shiftDate: "2026-09-10", timeSlot: "08:00-13:00", location: "Penguin Pens", hoursWorked: 4.5 },
      ],
    });

    await render(<HoursWorkedScreen />);

    expect(await screen.findByText("12.5")).toBeOnTheScreen();
    expect(screen.getByText("3")).toBeOnTheScreen();
    expect(screen.getByText("4.5")).toBeOnTheScreen();
    expect(screen.getByText("4.5 hrs")).toBeOnTheScreen();
    expect(screen.getByText("8 hrs")).toBeOnTheScreen();
  });

  it("shows unknown values, not zeros, when stats can't be loaded", async () => {
    mockedGetStats.mockRejectedValue(new Error("Network request failed"));

    await render(<HoursWorkedScreen />);

    expect(await screen.findByText("Couldn't load your shift history")).toBeOnTheScreen();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });
});
