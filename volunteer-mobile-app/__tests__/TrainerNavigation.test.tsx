import { router, Stack } from "expo-router";
import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import { ConfirmProvider } from "../src/components/ConfirmProvider";
import TrainerDashboardScreen from "../src/app/trainer-dashboard";
import TrainerSelectScreen from "../src/app/trainer-select";
import TrainerVolunteerScreen from "../src/app/trainer-volunteer/[volunteerId]";
import { logout } from "../src/services/auth";
import { getTrainers, selectTrainer } from "../src/services/trainers";
import { getTrainingVolunteerProfile, getTrainingVolunteers } from "../src/services/training";

jest.mock("../src/services/auth");
jest.mock("../src/services/trainers");
jest.mock("../src/services/training");

const stub = (label: string) => () => <Text>{label}</Text>;
const routes = {
  _layout: () => (
    <ConfirmProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ConfirmProvider>
  ),
  index: stub("Welcome"),
  login: stub("Login"),
  "trainer-pin": stub("Trainer PIN"),
  "trainer-select": TrainerSelectScreen,
  "trainer-dashboard": TrainerDashboardScreen,
  "trainer-volunteer/[volunteerId]": TrainerVolunteerScreen,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(logout).mockResolvedValue();
  jest.mocked(getTrainers).mockResolvedValue([
    { trainerId: 3, firstName: "Alex", lastName: "Trainer", email: null, phone: null, status: "Active" },
  ]);
  jest.mocked(selectTrainer).mockResolvedValue();
  jest.mocked(getTrainingVolunteers).mockResolvedValue([
    {
      userId: 11,
      firstName: "Sam",
      lastName: "Volunteer",
      completedSkills: 1,
      totalRequiredSkills: 4,
      progressPercentage: 25,
      trainingStatus: "InProgress",
    },
  ]);
  jest.mocked(getTrainingVolunteerProfile).mockResolvedValue({
    userId: 11,
    firstName: "Sam",
    lastName: "Volunteer",
    completedRequiredSkills: 1,
    totalRequiredSkills: 4,
    progressPercentage: 25,
    trainingStatus: "InProgress",
    supportingAreas: [],
    penRoutines: [],
    seasonalSkills: [],
  });
});

async function openTrainerSelect() {
  const app = renderRouter(routes, { initialUrl: "/" });
  await app;
  await act(() => router.push("/trainer-pin"));
  await act(() => router.push("/trainer-select"));
  return { app };
}

async function openDashboard() {
  const { app } = await openTrainerSelect();
  await fireEvent.press(await screen.findByText("Alex Trainer"));
  await screen.findByText("Sam Volunteer");
  expect(app.getPathname()).toBe("/trainer-dashboard");
  return { app };
}

const LOG_OUT_PROMPT = "Are you sure you want to log out?";

async function pressDialogButton(label: string) {
  await fireEvent.press(screen.getByRole("button", { name: label }));
}

const backActions: [string, () => void][] = [
  ["Back (Android back button)", () => router.back()],
  ["a pop (iOS back swipe)", () => router.dismiss()],
];

describe.each(backActions)("leaving the dashboard with %s", (_name, goBack) => {
  it("asks to log out, and confirming signs out and lands on Welcome with no history", async () => {
    const { app } = await openDashboard();

    await act(goBack);
    expect(screen.getByText(LOG_OUT_PROMPT)).toBeOnTheScreen();
    expect(app.getPathname()).toBe("/trainer-dashboard");

    await pressDialogButton("Log Out");
    expect(logout).toHaveBeenCalledTimes(1);
    expect(app.getPathname()).toBe("/");
    expect(router.canGoBack()).toBe(false);
  });
});

it("cancelling the log-out prompt keeps the trainer signed in on the dashboard", async () => {
  const { app } = await openDashboard();

  await act(() => router.back());
  await pressDialogButton("Cancel");

  expect(screen.queryByText(LOG_OUT_PROMPT)).toBeNull();
  expect(logout).not.toHaveBeenCalled();
  expect(app.getPathname()).toBe("/trainer-dashboard");
});

it("Back from a volunteer's details returns to the dashboard without logging out", async () => {
  const { app } = await openDashboard();

  await fireEvent.press(screen.getByText("Sam Volunteer"));
  expect(app.getPathname()).toBe("/trainer-volunteer/11");

  await act(() => router.back());

  expect(app.getPathname()).toBe("/trainer-dashboard");
  expect(screen.queryByText(LOG_OUT_PROMPT)).toBeNull();
  expect(logout).not.toHaveBeenCalled();
});

it("backing out of trainer select clears the PIN session and lands on Welcome with no history", async () => {
  const { app } = await openTrainerSelect();
  await screen.findByText("Alex Trainer");

  await act(() => router.back());

  expect(screen.queryByText(LOG_OUT_PROMPT)).toBeNull();
  expect(logout).toHaveBeenCalledTimes(1);
  expect(app.getPathname()).toBe("/");
  expect(router.canGoBack()).toBe(false);
});
