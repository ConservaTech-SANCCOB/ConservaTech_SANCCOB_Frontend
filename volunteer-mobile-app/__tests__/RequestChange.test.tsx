import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import RequestChangeScreen from "../src/app/(tabs)/bookings/request-change";
import { submitChangeRequest } from "../src/services/changeRequests";
import { ApiError } from "../src/utils/api";
import { showErrorToast } from "../src/utils/toast";

let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useNavigation: () => ({ getParent: () => ({ setOptions: jest.fn() }) }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock("../src/services/changeRequests");
jest.mock("../src/utils/toast");

const mockedSubmit = jest.mocked(submitChangeRequest);

// Fixed "now": Friday 25 Sept 2026, 12:00 local.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 25, 12, 0, 0), advanceTimers: true });
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  mockParams = { bookingId: "42", shiftDate: "2026-09-28", timeSlot: "08:00-13:00", location: "Penguin Pens" };
});
afterEach(() => {
  jest.useRealTimers();
});

describe("Request to Cancel", () => {
  it("shows the shift being cancelled", async () => {
    await render(<RequestChangeScreen />);

    expect(screen.getByText("Morning")).toBeOnTheScreen();
    expect(screen.getByText("08:00-13:00")).toBeOnTheScreen();
    expect(screen.getByText("Penguin Pens")).toBeOnTheScreen();
    expect(screen.getByText("In 3 days")).toBeOnTheScreen();
  });

  it("requires a reason before sending anything", async () => {
    await render(<RequestChangeScreen />);

    await fireEvent.press(screen.getByText("Cancel"));

    expect(Alert.alert).toHaveBeenCalledWith("Reason required", expect.any(String));
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it("sends the assignment and trimmed reason", async () => {
    mockedSubmit.mockResolvedValue(undefined as never);
    await render(<RequestChangeScreen />);

    await fireEvent.changeText(screen.getByLabelText("Reason for cancelling"), "  Family emergency  ");
    await fireEvent.press(screen.getByText("Cancel"));

    await waitFor(() =>
      expect(mockedSubmit).toHaveBeenCalledWith({ rosterAssignmentId: 42, reason: "Family emergency" })
    );
    expect(Alert.alert).toHaveBeenLastCalledWith("Request Submitted", expect.any(String), expect.any(Array));
  });

  it("shows the backend's message when the request is rejected", async () => {
    mockedSubmit.mockRejectedValue(new ApiError(400, '{"message":"A request for this shift is already pending."}'));
    await render(<RequestChangeScreen />);

    await fireEvent.changeText(screen.getByLabelText("Reason for cancelling"), "Sick");
    await fireEvent.press(screen.getByText("Cancel"));

    await waitFor(() =>
      expect(showErrorToast).toHaveBeenCalledWith("Couldn't submit", "A request for this shift is already pending.")
    );
  });

  it("won't cancel a shift that has already ended", async () => {
    mockParams = { bookingId: "42", shiftDate: "2026-09-25", timeSlot: "08:00-11:00", location: "Penguin Pens" };
    await render(<RequestChangeScreen />);

    expect(screen.getByText("This shift has already ended")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Reason for cancelling")).toBeNull();
  });
});
