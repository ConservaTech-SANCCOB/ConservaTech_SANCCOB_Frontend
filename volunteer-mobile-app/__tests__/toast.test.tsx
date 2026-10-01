import { render, screen } from "@testing-library/react-native";
import Toast from "react-native-toast-message";
import { toastConfig } from "../src/components/toastConfig";
import { showErrorToast } from "../src/utils/toast";

const LONG_MESSAGE =
  "This skill can't be signed off yet. The volunteer must complete all Supporting Areas before any Pen Routine can be signed off.";

describe("error toast", () => {
  it("shows the whole message over several lines instead of cutting it to one", async () => {
    const ErrorToastView = toastConfig.error!;
    await render(
      <ErrorToastView
        type="error"
        text1="Couldn't sign off"
        text2={LONG_MESSAGE}
        position="top"
        isVisible
        visibilityTime={4000}
        show={jest.fn()}
        hide={jest.fn()}
        onPress={jest.fn()}
        props={{}}
      />
    );

    const message = screen.getByText(LONG_MESSAGE);
    expect(message.props.numberOfLines).toBeGreaterThanOrEqual(5);
    expect(screen.getByText("Couldn't sign off")).toBeOnTheScreen();
  });

  it("keeps longer messages on screen longer, capped at 8 seconds", () => {
    const show = jest.spyOn(Toast, "show").mockImplementation(() => {});

    showErrorToast("Short", "Try again.");
    showErrorToast("Long", LONG_MESSAGE);
    showErrorToast("Very long", LONG_MESSAGE.repeat(5));

    const times = show.mock.calls.map(([options]) => options.visibilityTime);
    expect(times[0]).toBeLessThan(times[1]!);
    expect(times[2]).toBe(8000);
  });
});
