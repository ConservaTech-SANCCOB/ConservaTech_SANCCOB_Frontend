import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import MyShiftCard from "../src/components/MyShiftCard";
import { MyShift } from "../src/services/shifts";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

const shift: MyShift = {
  rosterAssignmentId: 42,
  shiftId: 7,
  status: "Assigned",
  shiftDate: "2099-01-10",
  timeSlot: "08:00-13:00",
  location: "Penguin Pens",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MyShiftCard details popup", () => {
  it("says the cancellation request is pending review", async () => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    await render(<MyShiftCard item={shift} cancellationPending />);

    await fireEvent.press(screen.getByText("Penguin Pens"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Morning shift",
      expect.stringContaining("Cancellation request pending review"),
      [{ text: "Close", style: "cancel" }]
    );
  });
});
