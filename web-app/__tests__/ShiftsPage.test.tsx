import { fireEvent, render, screen } from "@testing-library/react";
import ShiftSchedulingPage from "../app/(admin)/shifts/page";
import { fetchShifts, fetchVacancies, Shift, Vacancy } from "../app/lib/api/shifts";
import { useAuth } from "../app/lib/auth-context";

jest.mock("../app/lib/auth-context");
jest.mock("../app/lib/api/shifts", () => ({
  ...jest.requireActual("../app/lib/api/shifts"),
  fetchShifts: jest.fn(),
  fetchVacancies: jest.fn(),
}));

//--------------------HELPERS--------------------//

function shift(shiftId: number, shiftDate: string, location: string, capacity: number): Shift {
  return { shiftId, shiftDate, timeSlot: "08:00-13:00", location, birdCount: capacity * 25, capacity };
}

function vacancy(source: Shift, assignedVolunteers: number): Vacancy {
  return {
    shiftId: source.shiftId,
    shiftDate: source.shiftDate,
    timeSlot: source.timeSlot,
    location: source.location,
    birdCount: source.birdCount ?? 0,
    capacity: source.capacity,
    assignedVolunteers,
    vacanciesAvailable: source.capacity - assignedVolunteers,
  };
}

async function findShiftButton(location: string) {
  return screen.findByTitle(`${location} · 08:00-13:00`);
}

function dayNumberOfCell(shiftButton: HTMLElement) {
  const cell = shiftButton.parentElement!.parentElement!;
  return cell.querySelector("span")?.textContent;
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 2, 10, 0, 0), advanceTimers: true });
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    token: "jwt-token",
    role: "Admin",
    isLoading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  });
});

afterEach(() => {
  jest.useRealTimers();
});

//--------------------TESTS--------------------//

describe("ShiftSchedulingPage calendar", () => {
  it("a shift dated 5 Oct appears in the 5 Oct cell (South African time)", async () => {
    const penguinPens = shift(1, "2026-10-05", "Penguin Pens", 2);
    jest.mocked(fetchShifts).mockResolvedValue([penguinPens]);
    jest.mocked(fetchVacancies).mockResolvedValue([vacancy(penguinPens, 1)]);

    render(<ShiftSchedulingPage />);

    expect(dayNumberOfCell(await findShiftButton("Penguin Pens"))).toBe("5");
  });

  it("shifts are labelled Fully Staffed, Understaffed or Critical from their bookings", async () => {
    const full = shift(1, "2026-10-05", "Pen A", 2);
    const short = shift(2, "2026-10-06", "Pen B", 4);
    const critical = shift(3, "2026-10-07", "Pen C", 4);
    jest.mocked(fetchShifts).mockResolvedValue([full, short, critical]);
    jest.mocked(fetchVacancies).mockResolvedValue([vacancy(full, 2), vacancy(short, 3), vacancy(critical, 1)]);
    render(<ShiftSchedulingPage />);

    // The legend already shows each label once
    fireEvent.click(await findShiftButton("Pen A"));
    expect(screen.getAllByText("Fully Staffed")).toHaveLength(2);

    fireEvent.click(await findShiftButton("Pen B"));
    expect(screen.getAllByText("Understaffed")).toHaveLength(2);

    fireEvent.click(await findShiftButton("Pen C"));
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getAllByText("Fully Staffed")).toHaveLength(1);
  });
});

//----------------------------------- END OF FILE ---------------------------------//
