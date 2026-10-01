import { fireEvent, render, screen } from "@testing-library/react-native";
import { ErrorBoundary } from "../src/app/_layout";
import { logError } from "../src/utils/logError";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  Stack: Object.assign(() => null, { Screen: () => null }),
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

const runtime = globalThis as unknown as { __DEV__: boolean };
const devFlag = runtime.__DEV__;

beforeEach(() => {
  jest.clearAllMocks();
});
afterEach(() => {
  runtime.__DEV__ = devFlag;
});

describe("Root ErrorBoundary", () => {
  it("shows a friendly message, logs the error, and retries", async () => {
    const retry = jest.fn(() => Promise.resolve());
    const error = new Error("Cannot read properties of undefined");
    await render(<ErrorBoundary error={error} retry={retry} />);

    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(logError).toHaveBeenCalledWith("Render error caught by ErrorBoundary", error);

    await fireEvent.press(screen.getByText("Try again"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("hides the raw error outside development builds", async () => {
    runtime.__DEV__ = false;
    await render(<ErrorBoundary error={new Error("secret internal detail")} retry={jest.fn(() => Promise.resolve())} />);

    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.queryByText("secret internal detail")).toBeNull();
  });

  it("shows the raw error in development builds to help debugging", async () => {
    runtime.__DEV__ = true;
    await render(<ErrorBoundary error={new Error("secret internal detail")} retry={jest.fn(() => Promise.resolve())} />);

    expect(screen.getByText("secret internal detail")).toBeTruthy();
  });
});
