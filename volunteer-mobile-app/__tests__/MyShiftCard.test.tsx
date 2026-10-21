import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { ConfirmProvider } from "../src/components/ConfirmProvider";
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
});

describe("MyShiftCard details popup", () => {
  it("says the cancellation request is pending review", async () => {
    await render(
      <ConfirmProvider>
        <MyShiftCard item={shift} cancellationPending />
      </ConfirmProvider>
    );

    const dialog = await pressToOpenDialog(screen.getByText("Penguin Pens"));

    expect(screen.getByText("Morning shift")).toBeOnTheScreen();
    expect(screen.getByText(/Cancellation request pending review/)).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Close" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Cancel Shift" })).toBeNull();

    await chooseInDialog(dialog, "Close");
    expect(screen.queryByText("Morning shift")).toBeNull();
  });
});
