import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fetchShiftLocations, ShiftPayload } from "../app/lib/api/shifts";
import { useAuth } from "../app/lib/auth-context";
import { ShiftFormModal } from "../components/shifts/ShiftFormModal";

jest.mock("../app/lib/auth-context");
jest.mock("../app/lib/api/shifts", () => ({
  ...jest.requireActual("../app/lib/api/shifts"),
  fetchShiftLocations: jest.fn(),
}));

//--------------------HELPERS--------------------//

const LOCATIONS = [
  { skillId: 1, locationName: "Pen A", locationType: "Pen Routine" },
  { skillId: 2, locationName: "Laundry", locationType: "Supporting Area" },
];

const onSave = jest.fn<Promise<void>, [ShiftPayload]>();

async function renderForm(props: Partial<Parameters<typeof ShiftFormModal>[0]> = {}) {
  const view = render(<ShiftFormModal mode="create" onCancel={jest.fn()} onSave={onSave} {...props} />);
  await screen.findByRole("option", { name: "Pen A" });
  return view;
}

function setValue(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit() {
  fireEvent.submit(screen.getByRole("button", { name: /Create Shift|Save Changes/ }).closest("form")!);
}

beforeEach(() => {
  jest.clearAllMocks();
  onSave.mockResolvedValue(undefined);
  jest.mocked(useAuth).mockReturnValue({
    token: "jwt-token",
    role: "Admin",
    isLoading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  });
  jest.mocked(fetchShiftLocations).mockResolvedValue(LOCATIONS);
});

//--------------------TESTS--------------------//

describe("ShiftFormModal", () => {
  it("a missing date or area shows an error and nothing is saved", async () => {
    await renderForm();

    submit();
    expect(await screen.findByText("Please select a valid date.")).toBeInTheDocument();

    setValue("Date", "2026-10-05");
    submit();
    expect(await screen.findByText("Please select a skill / area.")).toBeInTheDocument();

    expect(onSave).not.toHaveBeenCalled();
  });

  it("pen routine: capacity is 1 per 25 birds rounded up, minimum 1 (26 → 2, 0 → 1), and sends birdCount and the skill", async () => {
    await renderForm();
    setValue("Date", "2026-10-05");
    setValue("Skills", "1");

    setValue("Bird Count", "26");
    expect(screen.getByText("2 volunteers")).toBeInTheDocument();
    submit();
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenLastCalledWith({
      shiftName: "Pen A – Morning",
      shiftDate: "2026-10-05",
      timeSlot: "08:00-13:00",
      location: "Pen A",
      birdCount: 26,
      capacity: 2,
      requiredSkillIds: [1],
    });

    setValue("Bird Count", "0");
    expect(screen.getByText("1 volunteer")).toBeInTheDocument();
    submit();
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ birdCount: 0, capacity: 1 }));
  });

  it("supporting area: sends the manual capacity and birdCount: null", async () => {
    await renderForm();
    setValue("Date", "2026-10-05");
    setValue("Skills", "2");
    setValue("Volunteer Capacity Needed", "3");

    submit();

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ location: "Laundry", birdCount: null, capacity: 3, requiredSkillIds: [2] })
    );
    expect(screen.queryByLabelText("Bird Count")).not.toBeInTheDocument();
  });

  it("editing preselects the shift's area", async () => {
    await renderForm({
      mode: "edit",
      shift: { shiftName: "Pen A – Afternoon", shiftDate: "2026-10-05", timeSlot: "14:00-17:00", location: "pen a", birdCount: 50, capacity: 2 },
    });

    await waitFor(() => expect(screen.getByLabelText("Skills")).toHaveValue("1"));
    expect(screen.getByLabelText("Bird Count")).toHaveValue(50);
    expect(screen.getByText("2 volunteers")).toBeInTheDocument();
  });
});

//----------------------------------- END OF FILE ---------------------------------//
