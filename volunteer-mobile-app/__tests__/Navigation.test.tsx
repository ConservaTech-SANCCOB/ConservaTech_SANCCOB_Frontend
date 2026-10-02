import { router, Stack } from "expo-router";
import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { Alert, Text } from "react-native";
import HomeScreen from "../src/app/(tabs)/home/index";
import BookingsScreen from "../src/app/(tabs)/bookings/index";
import RequestChangeScreen from "../src/app/request-change";
import LoginScreen from "../src/app/login";
import { login } from "../src/services/auth";
import { getPendingCancellationIds } from "../src/services/changeRequests";
import { getMyNotifications } from "../src/services/notifications";
import { getMyProfile } from "../src/services/profile";
import { getMyShifts } from "../src/services/shifts";

jest.mock("../src/services/auth");
jest.mock("../src/services/shifts");
jest.mock("../src/services/changeRequests");
jest.mock("../src/services/notifications");
jest.mock("../src/services/profile");
jest.mock("../src/services/vacancies");

const stub = (label: string) => () => <Text>{label}</Text>;
const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  index: stub("Welcome"),
  login: LoginScreen,
  "request-change": RequestChangeScreen,
  "(tabs)/_layout": require("../src/app/(tabs)/_layout"),
  "(tabs)/home/_layout": require("../src/app/(tabs)/home/_layout"),
  "(tabs)/home/index": HomeScreen,
  "(tabs)/home/notifications": stub("Notifications"),
  "(tabs)/bookings/_layout": require("../src/app/(tabs)/bookings/_layout"),
  "(tabs)/bookings/index": BookingsScreen,
  "(tabs)/bookings/submit-availability": stub("Submit availability"),
  "(tabs)/progress/_layout": require("../src/app/(tabs)/progress/_layout"),
  "(tabs)/progress/index": stub("Training"),
  "(tabs)/progress/hours": stub("Hours"),
  "(tabs)/profile": stub("Profile"),
};

const tab = (name: string) => screen.queryByRole("tab", { name });
async function pressTab(name: string) {
  await fireEvent.press(tab(name)!);
  await act(() => jest.advanceTimersByTime(1000));
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 25, 12, 0, 0), advanceTimers: true });
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.mocked(getMyShifts).mockResolvedValue([
    {
      rosterAssignmentId: 42,
      shiftId: 7,
      status: "Assigned",
      shiftDate: "2026-09-26",
      timeSlot: "08:00-13:00",
      location: "Penguin Pens",
    },
  ]);
  jest.mocked(getPendingCancellationIds).mockResolvedValue(new Set());
  jest.mocked(getMyNotifications).mockResolvedValue([]);
  jest.mocked(getMyProfile).mockResolvedValue({
    firstName: "Sam",
    lastName: "Volunteer",
    email: "sam@example.com",
    phoneNumber: null,
    nationality: null,
    ageBracket: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
  });
});
afterEach(() => {
  jest.useRealTimers();
});

async function openRequestToCancel() {
  await fireEvent.press(await screen.findByRole("button", { name: "Cancel shift" }));
  await screen.findByLabelText("Reason for cancelling");
}

const startingScreens: [string, string, string][] = [
  ["a Home shift card", "/(tabs)/home", "/home"],
  ["the Shifts list", "/(tabs)/bookings", "/bookings"],
];

describe.each(startingScreens)("Request to Cancel opened from %s", (_name, initialUrl, startingPath) => {
  it("Back returns to where it was opened, with the tab bar", async () => {
    const app = renderRouter(routes, { initialUrl });
    await app;

    await openRequestToCancel();
    expect(app.getPathname()).toBe("/request-change");

    await fireEvent.press(screen.getByRole("button", { name: "Go back" }));
    expect(app.getPathname()).toBe(startingPath);
    expect(tab("Home")).toBeOnTheScreen();
  });
});

it("returning to a tab shows its main screen, not a sub-screen left open", async () => {
  const app = renderRouter(routes, { initialUrl: "/(tabs)/home" });
  await app;

  await act(() => router.push("/(tabs)/home/notifications"));
  await pressTab("Shift");
  await pressTab("Home");
  expect(app.getPathname()).toBe("/home");

  await pressTab("Training");
  await act(() => router.push("/(tabs)/progress/hours"));
  await pressTab("Home");
  await pressTab("Training");
  expect(app.getPathname()).toBe("/progress");

  await pressTab("Shift");
  await act(() => router.push("/(tabs)/bookings/submit-availability"));
  await pressTab("Home");
  await pressTab("Shift");
  expect(app.getPathname()).toBe("/bookings");
  expect(tab("Home")).toBeOnTheScreen();
});

it("after logging in, Back can't return to the welcome or login screens", async () => {
  jest.mocked(login).mockResolvedValue(undefined as never);
  const app = renderRouter(routes, { initialUrl: "/" });
  await app;

  await act(() => router.push("/login"));
  await fireEvent.changeText(screen.getByLabelText("Email address"), "sam@example.com");
  await fireEvent.changeText(screen.getByLabelText("Password"), "secret123");
  await fireEvent.press(screen.getByText("Log In"));

  await screen.findByRole("button", { name: "Cancel shift" });
  expect(app.getPathname()).toBe("/home");
  expect(router.canGoBack()).toBe(false);
});
