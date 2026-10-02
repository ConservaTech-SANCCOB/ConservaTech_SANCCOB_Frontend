import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import SubmitAvailabilityScreen from "../src/app/(tabs)/bookings/submit-availability";
import { getMyAvailability, updateMyAvailability } from "../src/services/availability";
import { showInfoToast } from "../src/utils/toast";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useNavigation: () => ({ getParent: () => ({ setOptions: jest.fn() }) }),
  useFocusEffect: (effect: () => void) => jest.requireActual("react").useEffect(effect, [effect]),
}));
jest.mock("../src/services/availability");
jest.mock("../src/utils/toast");

const mockedGetMyAvailability = jest.mocked(getMyAvailability);
const mockedUpdateMyAvailability = jest.mocked(updateMyAvailability);

const cell = (label: string) => screen.getByRole("button", { name: label });
const emptySubmitButton = async () => (await screen.findAllByText("Submit Availability")).at(-1)!;

async function pressAlertButton(text: string) {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
  const button = buttons.find((b) => b.text === text);
  if (!button) throw new Error(`No "${text}" button in the last alert`);
  await act(async () => {
    await button.onPress?.();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
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
    expect(Alert.alert).toHaveBeenLastCalledWith("Saved", "Your availability has been updated.", expect.any(Array));
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
    await render(<SubmitAvailabilityScreen />);

    await fireEvent.press(await emptySubmitButton());

    expect(Alert.alert).toHaveBeenLastCalledWith("No availability selected", expect.any(String), expect.any(Array));
    await pressAlertButton("Cancel");
    expect(mockedUpdateMyAvailability).not.toHaveBeenCalled();

    await fireEvent.press(await emptySubmitButton());
    await pressAlertButton("Save");
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
