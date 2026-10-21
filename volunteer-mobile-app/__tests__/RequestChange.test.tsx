import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import RequestChangeScreen from "../src/app/request-change";
import { submitChangeRequest } from "../src/services/changeRequests";
import { showSuccessToast } from "../src/utils/toast";

let mockParams: Record<string, string> = {};
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock("../src/services/changeRequests");
jest.mock("../src/utils/toast");

const mockedSubmit = jest.mocked(submitChangeRequest);

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 25, 12, 0, 0), advanceTimers: true });
  jest.clearAllMocks();
  mockParams = { bookingId: "42", shiftDate: "2026-09-28", timeSlot: "08:00-13:00", location: "Penguin Pens" };
});
afterEach(() => {
  jest.useRealTimers();
});

describe("Request to Cancel", () => {
  it("sends the assignment and trimmed reason", async () => {
    mockedSubmit.mockResolvedValue(undefined as never);
    await render(<RequestChangeScreen />);

    await fireEvent.changeText(screen.getByLabelText("Reason for cancelling"), "  Family emergency  ");
    await fireEvent.press(screen.getByText("Submit request"));

    await waitFor(() =>
      expect(mockedSubmit).toHaveBeenCalledWith({ rosterAssignmentId: 42, reason: "Family emergency" })
    );
    expect(showSuccessToast).toHaveBeenLastCalledWith("Request Submitted", expect.any(String));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("won't cancel a shift that has already ended", async () => {
    mockParams = { bookingId: "42", shiftDate: "2026-09-25", timeSlot: "08:00-11:00", location: "Penguin Pens" };
    await render(<RequestChangeScreen />);

    expect(screen.getByText("This shift has already ended")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Reason for cancelling")).toBeNull();
  });
});
