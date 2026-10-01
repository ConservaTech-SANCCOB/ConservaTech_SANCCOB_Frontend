import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import BookingsScreen from "../src/app/(tabs)/bookings/index";
import { getPendingCancellationIds } from "../src/services/changeRequests";
import { getMyShifts, MyShift } from "../src/services/shifts";
import { bookVacancy, BookingRejectedError, getVacancies, Vacancy } from "../src/services/vacancies";
import { showErrorToast } from "../src/utils/toast";

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    router: { replace: jest.fn() },
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
    // No navigator in tests: treat "screen focused" as "mounted".
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
  };
});
jest.mock("../src/services/shifts");
jest.mock("../src/services/changeRequests");
jest.mock("../src/services/vacancies", () => ({
  ...jest.requireActual("../src/services/vacancies"),
  getVacancies: jest.fn(),
  bookVacancy: jest.fn(),
}));
jest.mock("../src/utils/toast");

const mockedGetVacancies = jest.mocked(getVacancies);
const mockedBookVacancy = jest.mocked(bookVacancy);
const mockedGetMyShifts = jest.mocked(getMyShifts);

/** YYYY-MM-DD for today + n days, in local time (matching how the app parses dates). */
function daysFromToday(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function vacancy(overrides: Partial<Vacancy>): Vacancy {
  return {
    shiftId: 1,
    shiftDate: daysFromToday(3),
    timeSlot: "08:00-13:00",
    location: "Penguin Pens",
    birdCount: 50,
    capacity: 2,
    assignedVolunteers: 0,
    vacanciesAvailable: 2,
    requiredSkillIds: [],
    ...overrides,
  };
}

/** Presses a button in the most recent Alert.alert() call, the way a user would. */
async function pressAlertButton(text: string) {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
  const button = buttons.find((b) => b.text === text);
  if (!button) throw new Error(`No "${text}" button in the last alert`);
  await act(async () => {
    await button.onPress?.();
  });
}

async function openAvailableTab() {
  await render(<BookingsScreen />);
  await fireEvent.press(screen.getByText("Available Shifts"));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  mockedGetMyShifts.mockResolvedValue([]);
  jest.mocked(getPendingCancellationIds).mockResolvedValue(new Set());
});

describe("Available Shifts", () => {
  it("only lists shifts the volunteer can actually book", async () => {
    const alreadyMine: MyShift = {
      rosterAssignmentId: 90,
      status: "Assigned",
      shiftId: 4,
      shiftDate: daysFromToday(2),
      timeSlot: "14:00-17:00",
      location: "Clinic",
    };
    mockedGetMyShifts.mockResolvedValue([alreadyMine]);
    mockedGetVacancies.mockResolvedValue([
      vacancy({ shiftId: 1, location: "Penguin Pens" }),
      vacancy({ shiftId: 2, location: "Full Pool", vacanciesAvailable: 0, assignedVolunteers: 2 }),
      vacancy({ shiftId: 3, location: "Yesterday Wash Bay", shiftDate: daysFromToday(-1) }),
      vacancy({ shiftId: 4, location: "Clinic", shiftDate: daysFromToday(2), timeSlot: "14:00-17:00" }),
    ]);

    await openAvailableTab();

    expect(await screen.findByText("Penguin Pens")).toBeOnTheScreen();
    expect(screen.queryByText("Full Pool")).toBeNull(); // no spots left
    expect(screen.queryByText("Yesterday Wash Bay")).toBeNull(); // already over
    expect(screen.queryByText("Clinic")).toBeNull(); // already assigned to it
    expect(screen.getByText("OPEN SHIFTS")).toBeOnTheScreen();
  });

  it("flags a shift with a single spot left as Limited", async () => {
    mockedGetVacancies.mockResolvedValue([vacancy({ vacanciesAvailable: 1, capacity: 2 })]);

    await openAvailableTab();

    expect(await screen.findByText("Limited")).toBeOnTheScreen();
    expect(screen.getByText("1 of 2 open")).toBeOnTheScreen();
  });

  it("asks for confirmation, books the shift and refreshes the list", async () => {
    mockedGetVacancies.mockResolvedValueOnce([vacancy({ shiftId: 7 })]).mockResolvedValue([]);
    mockedBookVacancy.mockResolvedValue({ rosterAssignmentId: 42, shiftId: 7, status: "Assigned", message: null });

    await openAvailableTab();
    await fireEvent.press(await screen.findByText("Book"));

    expect(Alert.alert).toHaveBeenLastCalledWith("Book this shift?", expect.any(String), expect.any(Array));
    expect(mockedBookVacancy).not.toHaveBeenCalled();

    await pressAlertButton("Book");

    expect(mockedBookVacancy).toHaveBeenCalledWith(7);
    await waitFor(() => expect(Alert.alert).toHaveBeenLastCalledWith("Shift booked", "It's now in your My Shifts."));
    expect(await screen.findByText("No open shifts right now")).toBeOnTheScreen();
  });

  it("does nothing if the volunteer cancels the confirmation", async () => {
    mockedGetVacancies.mockResolvedValue([vacancy({ shiftId: 7 })]);

    await openAvailableTab();
    await fireEvent.press(await screen.findByText("Book"));
    await pressAlertButton("Cancel");

    expect(mockedBookVacancy).not.toHaveBeenCalled();
  });

  it("shows the backend's reason when a booking is rejected", async () => {
    mockedGetVacancies.mockResolvedValue([vacancy({ shiftId: 7 })]);
    mockedBookVacancy.mockRejectedValue(new BookingRejectedError("This shift is already full."));

    await openAvailableTab();
    await fireEvent.press(await screen.findByText("Book"));
    await pressAlertButton("Book");

    await waitFor(() =>
      expect(showErrorToast).toHaveBeenCalledWith("Couldn't book this shift", "This shift is already full.")
    );
    // The list was probably stale, so it re-fetches to drop the card.
    expect(mockedGetVacancies).toHaveBeenCalledTimes(2);
  });

  it("shows an error state when shifts can't be loaded", async () => {
    mockedGetVacancies.mockRejectedValue(new Error("Network request failed"));

    await openAvailableTab();

    expect(await screen.findByText("Couldn't load shifts")).toBeOnTheScreen();
  });
});
