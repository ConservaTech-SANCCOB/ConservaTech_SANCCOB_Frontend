import { render, screen } from "@testing-library/react-native";
import NotificationsScreen from "../src/app/(tabs)/home/notifications";
import { getMyNotifications } from "../src/services/notifications";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));
jest.mock("../src/services/notifications");

// Fixed "now": Friday 25 Sept 2026, 12:00 local.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 25, 12, 0, 0), advanceTimers: true });
});
afterEach(() => {
  jest.useRealTimers();
});

it("shows when each notification was sent", async () => {
  jest.mocked(getMyNotifications).mockResolvedValue([
    {
      notificationId: 2,
      message: "You've been assigned a shift",
      type: "Assignment",
      isRead: false,
      createdAt: new Date(2026, 8, 25, 9, 5).toISOString(),
    },
    {
      notificationId: 1,
      message: "Welcome to SANCCOB",
      type: null,
      isRead: true,
      createdAt: new Date(2026, 8, 12, 14, 0).toISOString(),
    },
  ]);

  await render(<NotificationsScreen />);

  expect(await screen.findByText("You've been assigned a shift")).toBeOnTheScreen();
  expect(screen.getByText("Today, 09:05")).toBeOnTheScreen();
  expect(screen.getByText("12 Sep, 14:00")).toBeOnTheScreen();
});
