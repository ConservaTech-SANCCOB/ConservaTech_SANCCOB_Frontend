import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import SubmitAvailabilityScreen from "../src/app/(tabs)/bookings/submit-availability";
import { ConfirmProvider } from "../src/components/ConfirmProvider";
import { getMyAvailability, updateMyAvailability } from "../src/services/availability";
import { showInfoToast, showSuccessToast } from "../src/utils/toast";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: mockBack }),
  useNavigation: () => ({ getParent: () => ({ setOptions: jest.fn() }) }),
  useFocusEffect: (effect: () => void) => jest.requireActual("react").useEffect(effect, [effect]),
}));
jest.mock("../src/services/availability");
jest.mock("../src/utils/toast");

const mockedGetMyAvailability = jest.mocked(getMyAvailability);
const mockedUpdateMyAvailability = jest.mocked(updateMyAvailability);

const cell = (label: string) => screen.getByRole("button", { name: label });
const emptySubmitButton = async () => (await screen.findAllByText("Submit Availability")).at(-1)!;

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

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetMyAvailability.mockResolvedValue([]);
  mockedUpdateMyAvailability.mockResolvedValue(undefined);
});

describe("Submit Availability", () => {
  it("sends the picked blocks in the shift-style time format the backend accepts", async () => {
    await render(<SubmitAvailabilityScreen />);

    await fireEvent.press(await screen.findByRole("button", { name: "Wednesday Afternoon" }));
    await fireEvent.press(cell("Monday Morning"));
    await fireEvent.press(cell("Sunday Full Day"));
    await fireEvent.press(screen.getByText("Submit 3 blocks"));

    await waitFor(() => expect(mockedUpdateMyAvailability).toHaveBeenCalled());
    expect(mockedUpdateMyAvailability).toHaveBeenCalledWith([
      { dayOfWeek: "Monday", timeSlot: "08:00-13:00" },
      { dayOfWeek: "Wednesday", timeSlot: "14:00-17:00" },
      { dayOfWeek: "Sunday", timeSlot: "08:00-17:00" },
    ]);
    expect(showSuccessToast).toHaveBeenLastCalledWith("Saved", "Your availability has been updated.");
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("picking both Morning and Afternoon selects Full Day instead", async () => {
    await render(<SubmitAvailabilityScreen />);

    await fireEvent.press(await screen.findByRole("button", { name: "Thursday Morning" }));
    await fireEvent.press(cell("Thursday Afternoon"));

    expect(cell("Thursday Full Day")).toBeSelected();
    expect(cell("Thursday Morning")).not.toBeSelected();
    expect(cell("Thursday Afternoon")).not.toBeSelected();
    expect(showInfoToast).toHaveBeenCalledWith("Full day selected", expect.stringContaining("Thursday"));
    expect(screen.getByText("Submit 1 block")).toBeOnTheScreen();
  });

  it("warns before saving an empty grid, since that clears all availability", async () => {
    await render(
      <ConfirmProvider>
        <SubmitAvailabilityScreen />
      </ConfirmProvider>
    );

    const cancelled = await pressToOpenDialog(await emptySubmitButton());

    expect(screen.getByText("No availability selected")).toBeOnTheScreen();
    await chooseInDialog(cancelled, "Cancel");
    expect(screen.queryByText("No availability selected")).toBeNull();
    expect(mockedUpdateMyAvailability).not.toHaveBeenCalled();

    const confirmed = await pressToOpenDialog(await emptySubmitButton());
    await chooseInDialog(confirmed, "Save");
    expect(mockedUpdateMyAvailability).toHaveBeenCalledWith([]);
  });

  it("shows an error with Try again, and no grid to save, if saved availability can't be loaded", async () => {
    mockedGetMyAvailability.mockRejectedValueOnce(new Error("Network request failed"));
    mockedGetMyAvailability.mockResolvedValueOnce([{ dayOfWeek: "Monday", timeSlot: "08:00-13:00" }]);

    await render(<SubmitAvailabilityScreen />);

    expect(await screen.findByRole("button", { name: "Try again" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Monday Morning" })).toBeNull();
    expect(screen.getAllByText("Submit Availability")).toHaveLength(1);

    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("button", { name: "Monday Morning" })).toBeSelected();
    expect(mockedUpdateMyAvailability).not.toHaveBeenCalled();
  });
});
