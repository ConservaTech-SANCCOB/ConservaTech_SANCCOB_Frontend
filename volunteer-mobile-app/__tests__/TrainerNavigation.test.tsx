import { router, Stack } from "expo-router";
import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import { ConfirmProvider } from "../src/components/ConfirmProvider";
import TrainerDashboardScreen from "../src/app/trainer-dashboard";
import TrainerPinScreen from "../src/app/trainer-pin";
import TrainerVolunteerScreen from "../src/app/trainer-volunteer/[volunteerId]";
import { logout } from "../src/services/auth";
import { getTrainers, verifyTrainerPin } from "../src/services/trainers";
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
  "trainer-pin": TrainerPinScreen,
  "trainer-dashboard": TrainerDashboardScreen,
  "trainer-volunteer/[volunteerId]": TrainerVolunteerScreen,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(logout).mockResolvedValue();
  jest.mocked(verifyTrainerPin).mockResolvedValue(3);
  jest.mocked(getTrainers).mockResolvedValue([
    { trainerId: 2, firstName: "Other", lastName: "Person", email: null, phone: null, status: "Active" },
    { trainerId: 3, firstName: "Alex", lastName: "Trainer", email: null, phone: null, status: "Active" },
  ]);
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

async function openDashboard() {
  const app = renderRouter(routes, { initialUrl: "/" });
  await app;
  await act(() => router.push("/trainer-pin"));
  await fireEvent.changeText(await screen.findByDisplayValue(""), "123456");
  await fireEvent.press(screen.getByText("Continue"));
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

it("goes from the PIN straight to the dashboard, signed in as the PIN's own trainer", async () => {
  await openDashboard();

  expect(verifyTrainerPin).toHaveBeenCalledWith("123456");
  expect(screen.getByText("Signed in as Alex Trainer")).toBeOnTheScreen();
});

it("still opens the dashboard when the trainer's name can't be loaded", async () => {
  jest.mocked(getTrainers).mockRejectedValue(new Error("Network request failed"));

  await openDashboard();

  expect(screen.queryByText(/Signed in as/)).toBeNull();
});
