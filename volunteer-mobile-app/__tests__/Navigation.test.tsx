import { router, Stack } from "expo-router";
import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import HomeScreen from "../src/app/(tabs)/home/index";
import RequestChangeScreen from "../src/app/(tabs)/bookings/request-change";
import LoginScreen from "../src/app/login";
import { login } from "../src/services/auth";
import { getPendingCancellationIds } from "../src/services/changeRequests";
import { getMyNotifications } from "../src/services/notifications";
import { getMyProfile } from "../src/services/profile";
import { getMyShifts } from "../src/services/shifts";
import { resetTo } from "../src/utils/navigation";

jest.mock("../src/services/auth");
jest.mock("../src/services/shifts");
jest.mock("../src/services/changeRequests");
jest.mock("../src/services/notifications");
jest.mock("../src/services/profile");

const stub = (label: string) => () => <Text>{label}</Text>;
const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  index: stub("Welcome"),
  login: LoginScreen,
  "trainer-pin": stub("Trainer PIN"),
  "trainer-select": stub("Trainer select"),
  "trainer-dashboard": stub("Trainer dashboard"),
  "(tabs)/_layout": require("../src/app/(tabs)/_layout"),
  "(tabs)/home/_layout": require("../src/app/(tabs)/home/_layout"),
  "(tabs)/home/index": HomeScreen,
  "(tabs)/home/notifications": stub("Notifications"),
  "(tabs)/bookings/_layout": require("../src/app/(tabs)/bookings/_layout"),
  "(tabs)/bookings/index": stub("Shifts list"),
  "(tabs)/bookings/request-change": RequestChangeScreen,
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

describe("Cancel from a Home shift card (Shifts tab not opened yet)", () => {
  it("Back returns to the Shifts list, and View All later shows the list with the tab bar", async () => {
    const app = renderRouter(routes, { initialUrl: "/(tabs)/home" });
    await app;

    await fireEvent.press(await screen.findByRole("button", { name: "Cancel shift" }));
    expect(app.getPathname()).toBe("/bookings/request-change");
    expect(tab("Home")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Go back" }));
    expect(app.getPathname()).toBe("/bookings");
    expect(tab("Home")).toBeOnTheScreen();

    await pressTab("Home");
    await fireEvent.press(await screen.findByText("View All"));
    expect(app.getPathname()).toBe("/bookings");
    expect(tab("Home")).toBeOnTheScreen();
  });
});

it("shows the tab bar on any screen opened on top of Request Change", async () => {
  const app = renderRouter(routes, { initialUrl: "/(tabs)/bookings" });
  await app;

  await act(() => router.push("/(tabs)/bookings/request-change?bookingId=42&shiftDate=2026-09-26"));
  expect(tab("Home")).toBeNull();

  await act(() => router.push("/(tabs)/bookings"));
  expect(app.getPathname()).toBe("/bookings");
  expect(tab("Home")).toBeOnTheScreen();
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

it("after a trainer logs out, Back can't return to the trainer screens", async () => {
  const app = renderRouter(routes, { initialUrl: "/" });
  await app;

  await act(() => router.push("/trainer-pin"));
  await act(() => router.push("/trainer-select"));
  await act(() => router.push("/trainer-dashboard"));
  await act(() => resetTo("/"));

  expect(app.getPathname()).toBe("/");
  expect(router.canGoBack()).toBe(false);
});
