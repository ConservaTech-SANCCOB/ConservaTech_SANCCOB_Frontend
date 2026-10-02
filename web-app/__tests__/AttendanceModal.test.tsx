import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "../app/lib/api/http";
import {
  fetchAttendanceForAssignment,
  fetchWeeklyRoster,
  Roster,
  RosterAssignment,
  updateAttendanceStatus,
} from "../app/lib/api/roster";
import { Volunteer } from "../app/lib/api/volunteers";
import { useAuth } from "../app/lib/auth-context";
import AttendanceModal from "../components/volunteers/AttendanceModal";

jest.mock("../app/lib/auth-context");
jest.mock("../app/lib/api/roster");

//--------------------HELPERS--------------------//

const SAM: Volunteer = {
  id: "7",
  firstName: "Sam",
  lastName: "Volunteer",
  name: "Sam Volunteer",
  initials: "SV",
  email: "sam@sanccob.co.za",
  phone: "",
  weeklyHours: 0,
  attendanceRate: 0,
  nationality: "",
  ageBracket: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

function assignment(rosterAssignmentId: number, userId: number, location: string): RosterAssignment {
  return {
    rosterAssignmentId,
    rosterId: 3,
    shiftId: rosterAssignmentId,
    userId,
    firstName: null,
    lastName: null,
    shiftDate: "2026-09-29",
    timeSlot: "08:00-13:00",
    location,
    status: "Assigned",
  };
}

const ROSTER: Roster = {
  rosterId: 3,
  weekStartDate: "2026-09-28",
  weekEndDate: "2026-10-04",
  status: "Published",
  generatedAt: null,
  assignments: [assignment(101, 7, "Penguin Pens"), assignment(102, 8, "Laundry")],
};

const onAttendanceChanged = jest.fn();

function renderModal() {
  return render(<AttendanceModal volunteer={SAM} onClose={jest.fn()} onAttendanceChanged={onAttendanceChanged} />);
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
  jest.mocked(fetchWeeklyRoster).mockResolvedValue(ROSTER);
  jest.mocked(fetchAttendanceForAssignment).mockResolvedValue({});
  jest.mocked(updateAttendanceStatus).mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

//--------------------TESTS--------------------//

describe("AttendanceModal", () => {
  it("lists only this volunteer's shifts for the week", async () => {
    renderModal();

    expect(await screen.findByText("08:00-13:00 · Penguin Pens")).toBeInTheDocument();
    expect(screen.queryByText(/Laundry/)).not.toBeInTheDocument();
    expect(fetchWeeklyRoster).toHaveBeenCalledWith("jwt-token", "2026-09-28");
    expect(fetchAttendanceForAssignment).toHaveBeenCalledTimes(1);
    expect(fetchAttendanceForAssignment).toHaveBeenCalledWith("jwt-token", 101);
  });

  it("a week with no roster (404) shows the empty state, not an error", async () => {
    jest.mocked(fetchWeeklyRoster).mockRejectedValue(new ApiError("Roster not found", 404));

    renderModal();

    expect(await screen.findByText("No roster has been generated for this week.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("marking attended saves it, refreshes the volunteer list and confirms", async () => {
    renderModal();
    await screen.findByText("08:00-13:00 · Penguin Pens");
    jest.mocked(fetchAttendanceForAssignment).mockResolvedValue({ rosterAssignmentId: 101, attended: true, hoursWorked: 5 });

    fireEvent.click(screen.getByRole("button", { name: "Mark attended" }));

    expect(await screen.findByText(/marked as attended\.$/)).toBeInTheDocument();
    expect(updateAttendanceStatus).toHaveBeenCalledWith("jwt-token", 101, true);
    expect(onAttendanceChanged).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText("Attended")).toBeInTheDocument());
    expect(screen.getByText("5 hrs")).toBeInTheDocument();
  });
});

//----------------------------------- END OF FILE ---------------------------------//
