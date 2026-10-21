import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import BookingsScreen from "../src/app/(tabs)/bookings/index";
import { getPendingCancellationIds } from "../src/services/changeRequests";
import { getMyShifts, MyShift } from "../src/services/shifts";
import { bookVacancy, BookingRejectedError, getVacancies, Vacancy } from "../src/services/vacancies";
import { ConfirmProvider } from "../src/components/ConfirmProvider";
import { showErrorToast, showSuccessToast } from "../src/utils/toast";

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
jest.mock("../src/services/vacancies", () => ({
  ...jest.requireActual("../src/services/vacancies"),
  getVacancies: jest.fn(),
  bookVacancy: jest.fn(),
}));
jest.mock("../src/utils/toast");

const mockedGetVacancies = jest.mocked(getVacancies);
const mockedBookVacancy = jest.mocked(bookVacancy);
const mockedGetMyShifts = jest.mocked(getMyShifts);

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

// Press stays pending until a dialog choice
async function pressToOpenDialog(element: Parameters<typeof fireEvent.press>[0]) {
  const pressing = fireEvent.press(element);
  await new Promise(setImmediate);
  return { pressing };
}

async function chooseInDialog({ pressing }: { pressing: Promise<void> }, label: string) {
  await fireEvent.press(screen.getByRole("button", { name: label }));
  await act(async () => {
    await pressing;
  });
}

async function openAvailableTab() {
  await render(
    <ConfirmProvider>
      <BookingsScreen />
    </ConfirmProvider>
  );
  await fireEvent.press(screen.getByText("Available Shifts"));
}

beforeEach(() => {
  jest.clearAllMocks();
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
    expect(screen.queryByText("Full Pool")).toBeNull();
    expect(screen.queryByText("Yesterday Wash Bay")).toBeNull();
    expect(screen.queryByText("Clinic")).toBeNull();
    expect(screen.getByText("OPEN SHIFTS")).toBeOnTheScreen();
  });

  it("asks for confirmation, books the shift and refreshes the list", async () => {
    mockedGetVacancies.mockResolvedValueOnce([vacancy({ shiftId: 7 })]).mockResolvedValue([]);
    mockedBookVacancy.mockResolvedValue({ rosterAssignmentId: 42, shiftId: 7, status: "Assigned", message: null });

    await openAvailableTab();
    const dialog = await pressToOpenDialog(await screen.findByText("Book"));

    expect(screen.getByText("Book this shift?")).toBeOnTheScreen();
    expect(mockedBookVacancy).not.toHaveBeenCalled();

    await chooseInDialog(dialog, "Book");

    expect(mockedBookVacancy).toHaveBeenCalledWith(7);
    expect(showSuccessToast).toHaveBeenCalledWith("Shift booked", "It's now in your My Shifts.");
    expect(await screen.findByText("No open shifts right now")).toBeOnTheScreen();
  });

  it("shows the backend's reason when a booking is rejected", async () => {
    mockedGetVacancies.mockResolvedValue([vacancy({ shiftId: 7 })]);
    mockedBookVacancy.mockRejectedValue(new BookingRejectedError("This shift is already full."));

    await openAvailableTab();
    const dialog = await pressToOpenDialog(await screen.findByText("Book"));
    await chooseInDialog(dialog, "Book");

    await waitFor(() =>
      expect(showErrorToast).toHaveBeenCalledWith("Couldn't book this shift", "This shift is already full.")
    );
    expect(mockedGetVacancies).toHaveBeenCalledTimes(2);
  });

  it("shows an error state when shifts can't be loaded", async () => {
    mockedGetVacancies.mockRejectedValue(new Error("Network request failed"));

    await openAvailableTab();

    expect(await screen.findByText("Couldn't load shifts")).toBeOnTheScreen();
  });
});
