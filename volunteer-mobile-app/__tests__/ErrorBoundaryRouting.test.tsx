import { fireEvent, screen } from "@testing-library/react-native";
import { Slot } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import { Text } from "react-native";
import { ErrorBoundary } from "../src/app/_layout";

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

let shouldCrash = true;
function CrashingScreen() {
  if (shouldCrash) throw new Error("render crash");
  return <Text>Recovered screen</Text>;
}

// Uses Expo Router's real routing so this checks the boundary is actually applied,
// not just exported. The layout is a bare Slot to keep the real root's session and
// splash logic out of the way; ErrorBoundary is the one the real root exports.
it("catches a screen that crashes while rendering, and Try again renders it again", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {}); // React logs caught render errors
  await renderRouter({
    _layout: { default: () => <Slot />, ErrorBoundary },
    index: CrashingScreen,
  });

  expect(await screen.findByText("Something went wrong")).toBeTruthy();

  shouldCrash = false;
  await fireEvent.press(screen.getByText("Try again"));
  expect(await screen.findByText("Recovered screen")).toBeTruthy();
});
