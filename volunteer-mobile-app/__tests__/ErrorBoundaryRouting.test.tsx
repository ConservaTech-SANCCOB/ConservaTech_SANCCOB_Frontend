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

it("catches a screen that crashes while rendering, and Try again renders it again", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  await renderRouter({
    _layout: { default: () => <Slot />, ErrorBoundary },
    index: CrashingScreen,
  });

  expect(await screen.findByText("Something went wrong")).toBeTruthy();

  shouldCrash = false;
  await fireEvent.press(screen.getByText("Try again"));
  expect(await screen.findByText("Recovered screen")).toBeTruthy();
});
