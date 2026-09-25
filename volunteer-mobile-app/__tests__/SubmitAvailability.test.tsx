import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import SubmitAvailabilityScreen from "../src/app/(tabs)/bookings/submit-availability";
import { getMyAvailability, updateMyAvailability } from "../src/services/availability";
import { ApiError } from "../src/utils/api";
import { showErrorToast } from "../src/utils/toast";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useNavigation: () => ({ getParent: () => ({ setOptions: jest.fn() }) }),
}));
jest.mock("../src/services/availability");
jest.mock("../src/utils/toast");

const mockedGetMyAvailability = jest.mocked(getMyAvailability);
const mockedUpdateMyAvailability = jest.mocked(updateMyAvailability);

const cell = (label: string) => screen.getByRole("button", { name: label });
// "Submit Availability" is both the page title and the empty-grid button label;
// the button is the last one rendered.
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
  it("pre-selects the volunteer's saved availability", async () => {
    mockedGetMyAvailability.mockResolvedValue([
      { dayOfWeek: "Monday", timeSlot: "08:00-13:00" },
      { dayOfWeek: "Saturday", timeSlot: "08:00-17:00" },
    ]);

    await render(<SubmitAvailabilityScreen />);

    expect(await screen.findByText("Submit 2 blocks")).toBeOnTheScreen();
    expect(cell("Monday Morning")).toBeSelected();
    expect(cell("Saturday Full Day")).toBeSelected();
    expect(cell("Monday Afternoon")).not.toBeSelected();
  });

  it("sends the picked blocks in the shift-style time format the backend accepts", async () => {
    await render(<SubmitAvailabilityScreen />);

    await fireEvent.press(await screen.findByRole("button", { name: "Wednesday Afternoon" }));
    await fireEvent.press(cell("Monday Morning"));
    await fireEvent.press(cell("Sunday Full Day"));
    await fireEvent.press(screen.getByText("Submit 3 blocks"));

    await waitFor(() => expect(mockedUpdateMyAvailability).toHaveBeenCalled());
    // Always Monday -> Sunday, regardless of the order they were tapped in.
    expect(mockedUpdateMyAvailability).toHaveBeenCalledWith([
      { dayOfWeek: "Monday", timeSlot: "08:00-13:00" },
      { dayOfWeek: "Wednesday", timeSlot: "14:00-17:00" },
      { dayOfWeek: "Sunday", timeSlot: "08:00-17:00" },
    ]);
    expect(Alert.alert).toHaveBeenLastCalledWith("Saved", "Your availability has been updated.", expect.any(Array));
  });

  it("tapping a block again deselects it", async () => {
    await render(<SubmitAvailabilityScreen />);

    await fireEvent.press(await screen.findByRole("button", { name: "Friday Morning" }));
    expect(cell("Friday Morning")).toBeSelected();
    await fireEvent.press(cell("Friday Morning"));
    expect(cell("Friday Morning")).not.toBeSelected();
  });

  it("Full Day replaces Morning/Afternoon on the same day, and vice versa", async () => {
    await render(<SubmitAvailabilityScreen />);

    await fireEvent.press(await screen.findByRole("button", { name: "Tuesday Morning" }));
    await fireEvent.press(cell("Tuesday Afternoon"));
    await fireEvent.press(cell("Tuesday Full Day"));

    expect(cell("Tuesday Full Day")).toBeSelected();
    expect(cell("Tuesday Morning")).not.toBeSelected();
    expect(cell("Tuesday Afternoon")).not.toBeSelected();

    await fireEvent.press(cell("Tuesday Morning"));

    expect(cell("Tuesday Morning")).toBeSelected();
    expect(cell("Tuesday Full Day")).not.toBeSelected();
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

  it("shows the backend's message when saving fails", async () => {
    mockedUpdateMyAvailability.mockRejectedValue(new ApiError(400, '{"message":"Invalid time slot."}'));
    await render(<SubmitAvailabilityScreen />);

    await fireEvent.press(await screen.findByRole("button", { name: "Monday Morning" }));
    await fireEvent.press(screen.getByText("Submit 1 block"));

    await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith("Couldn't save", "Invalid time slot."));
  });

  it("falls back to a blank grid if saved availability can't be loaded", async () => {
    mockedGetMyAvailability.mockRejectedValue(new Error("Network request failed"));

    await render(<SubmitAvailabilityScreen />);

    expect(await emptySubmitButton()).toBeOnTheScreen();
    expect(cell("Monday Morning")).not.toBeSelected();
    expect(showErrorToast).toHaveBeenCalledWith("Couldn't load availability", "Starting from a blank grid instead.");
  });
});
