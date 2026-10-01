import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import MyShiftCard from "../src/components/MyShiftCard";
import { MyShift } from "../src/services/shifts";
import { COLORS } from "../src/utils/colors";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: mockPush, back: jest.fn() }),
}));

const shift: MyShift = {
  rosterAssignmentId: 42,
  shiftId: 7,
  status: "Assigned",
  shiftDate: "2099-01-10",
  timeSlot: "08:00-13:00",
  location: "Penguin Pens",
};

/** The fill of the nearest element behind the button's label that has one (the pill). */
function cancelButtonColor() {
  let node = screen.getByText("Cancel").parent;
  while (node) {
    const background = StyleSheet.flatten(node.props.style)?.backgroundColor;
    if (background) return background;
    node = node.parent;
  }
  return undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MyShiftCard cancel button", () => {
  it("just says Cancel", async () => {
    await render(<MyShiftCard item={shift} />);
    expect(screen.getByText("Cancel")).toBeOnTheScreen();
    expect(screen.queryByText("Request to Cancel")).toBeNull();
  });

  it("is blue by default (Home) and takes the screen's accent (gold on Shifts)", async () => {
    const { rerender } = await render(<MyShiftCard item={shift} />);
    expect(cancelButtonColor()).toBe(COLORS.blueMid);

    await rerender(<MyShiftCard item={shift} accent={COLORS.amberFill} />);
    expect(cancelButtonColor()).toBe(COLORS.amberFill);
  });

  it("opens the cancellation request screen for this shift", async () => {
    await render(<MyShiftCard item={shift} />);

    await fireEvent.press(screen.getByRole("button", { name: "Cancel shift" }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/bookings/request-change",
        params: expect.objectContaining({ bookingId: "42", shiftDate: "2099-01-10" }),
      })
    );
  });

  it("is hidden once a cancellation is already pending", async () => {
    await render(<MyShiftCard item={shift} cancellationPending />);
    expect(screen.queryByText("Cancel")).toBeNull();
  });
});
