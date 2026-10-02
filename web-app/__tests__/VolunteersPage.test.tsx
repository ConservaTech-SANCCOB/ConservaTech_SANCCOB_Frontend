import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VolunteersPage from "../app/(admin)/volunteers/page";
import { useAuth } from "../app/lib/auth-context";
import { createVolunteer, fetchShiftRequests, fetchVolunteers, Volunteer } from "../app/lib/api/volunteers";

jest.mock("../app/lib/auth-context");
jest.mock("../app/lib/api/volunteers", () => ({
  ...jest.requireActual("../app/lib/api/volunteers"),
  fetchVolunteers: jest.fn(),
  fetchShiftRequests: jest.fn(),
  createVolunteer: jest.fn(),
}));
jest.mock("../components/volunteers/AttendanceModal", () => ({ __esModule: true, default: () => null }));

//--------------------HELPERS--------------------//

function volunteer(id: string, firstName: string, lastName: string, email: string): Volunteer {
  return {
    id,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    initials: `${firstName[0]}${lastName[0]}`,
    email,
    phone: "",
    weeklyHours: 4,
    attendanceRate: 90,
    nationality: "",
    ageBracket: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  };
}

const SAM = volunteer("1", "Sam", "Volunteer", "sam@sanccob.co.za");
const LEE = volunteer("2", "Lee", "Ndlovu", "lee.n@sanccob.co.za");
const THANDI = volunteer("3", "Thandi", "Mokoena", "thandi@sanccob.co.za");

async function fillCreateForm() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Create Volunteer" }));
  const form = screen.getByText("Create Volunteer Profile").closest("form")!;
  const [firstName, lastName, email, phone, nationality] = within(form).getAllByRole("textbox");
  await user.type(firstName, "Thandi");
  await user.type(lastName, "Mokoena");
  await user.type(email, "thandi@sanccob.co.za");
  await user.type(phone, "0821234567");
  await user.type(nationality, "South African");
  await user.selectOptions(within(form).getByRole("combobox"), "25-34");
  await user.click(within(form).getByRole("button", { name: "Create Volunteer" }));
  return form;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    token: "jwt-token",
    role: "Admin",
    isLoading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  });
  jest.mocked(fetchVolunteers).mockResolvedValue([SAM, LEE]);
  jest.mocked(fetchShiftRequests).mockResolvedValue([]);
});

//--------------------TESTS--------------------//

describe("VolunteersPage", () => {
  it("lists volunteers from the API, and search filters by name or email", async () => {
    const user = userEvent.setup();
    render(<VolunteersPage />);

    expect(await screen.findByText("Sam Volunteer")).toBeInTheDocument();
    expect(screen.getByText("Lee Ndlovu")).toBeInTheDocument();

    const search = screen.getByPlaceholderText("Search volunteers...");
    await user.type(search, "lee.n@");
    expect(screen.queryByText("Sam Volunteer")).not.toBeInTheDocument();
    expect(screen.getByText("Lee Ndlovu")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "sam vol");
    expect(screen.getByText("Sam Volunteer")).toBeInTheDocument();
    expect(screen.queryByText("Lee Ndlovu")).not.toBeInTheDocument();
  });

  it("if one request fails, its error shows and the other data still displays", async () => {
    jest.mocked(fetchShiftRequests).mockRejectedValue(new Error("Server unavailable"));

    render(<VolunteersPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Change requests: Server unavailable");
    expect(screen.getByText("Sam Volunteer")).toBeInTheDocument();
    expect(screen.getByText("Lee Ndlovu")).toBeInTheDocument();
  });

  it("creating a volunteer sends the form, reloads the list and returns to it", async () => {
    jest.mocked(createVolunteer).mockResolvedValue(undefined);
    render(<VolunteersPage />);
    await screen.findByText("Sam Volunteer");
    jest.mocked(fetchVolunteers).mockResolvedValue([SAM, LEE, THANDI]);

    await fillCreateForm();

    expect(createVolunteer).toHaveBeenCalledWith("jwt-token", {
      firstName: "Thandi",
      lastName: "Mokoena",
      email: "thandi@sanccob.co.za",
      phoneNumber: "0821234567",
      nationality: "South African",
      ageBracket: "25-34",
    });
    expect(await screen.findByText("Thandi Mokoena")).toBeInTheDocument();
    expect(screen.queryByText("Create Volunteer Profile")).not.toBeInTheDocument();
    expect(fetchVolunteers).toHaveBeenCalledTimes(2);
  });

  it("a failed create shows the backend's message in the form", async () => {
    jest.mocked(createVolunteer).mockRejectedValue(new Error("Email is already in use."));
    render(<VolunteersPage />);
    await screen.findByText("Sam Volunteer");

    const form = await fillCreateForm();

    expect(await within(form).findByRole("alert")).toHaveTextContent("Email is already in use.");
    expect(screen.getByText("Create Volunteer Profile")).toBeInTheDocument();
    expect(fetchVolunteers).toHaveBeenCalledTimes(1);
  });
});

//----------------------------------- END OF FILE ---------------------------------//
