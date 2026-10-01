import { act, fireEvent, render, screen } from "@testing-library/react-native";
import TrainerDashboardScreen from "../src/app/trainer-dashboard";
import { getTrainingVolunteers, TrainingVolunteerSummary } from "../src/services/training";

// useFocusEffect runs on mount like the other screen tests; the latest effect is kept
// so a test can simulate the screen regaining focus (e.g. Back from a volunteer).
let mockRefocus: () => void = () => {};
jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    router: { replace: jest.fn() },
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({ trainerName: "Alex Trainer" }),
    useFocusEffect: (effect: () => void) => {
      mockRefocus = effect;
      useEffect(effect, [effect]);
    },
  };
});
jest.mock("../src/services/training");
jest.mock("../src/services/auth");
jest.mock("../src/utils/useTrainerSignOut", () => ({ useTrainerSignOut: () => jest.fn() }));

const mockedGetVolunteers = jest.mocked(getTrainingVolunteers);

function volunteer(userId: number, firstName: string, completedSkills: number): TrainingVolunteerSummary {
  return {
    userId,
    firstName,
    lastName: "Volunteer",
    completedSkills,
    totalRequiredSkills: 4,
    progressPercentage: (completedSkills / 4) * 100,
    trainingStatus: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Trainer dashboard", () => {
  it("shows the volunteers once loaded", async () => {
    mockedGetVolunteers.mockResolvedValue([volunteer(1, "Sam", 1), volunteer(2, "Lee", 0)]);
    await render(<TrainerDashboardScreen />);
    expect(await screen.findByText("Sam Volunteer")).toBeTruthy();
    expect(screen.getByText("Lee Volunteer")).toBeTruthy();
    expect(screen.getByText("1 of 4 skills completed")).toBeTruthy();
  });

  it("refreshes progress when it regains focus, keeping the list and search on screen", async () => {
    mockedGetVolunteers.mockResolvedValueOnce([volunteer(1, "Sam", 1), volunteer(2, "Lee", 0)]);
    await render(<TrainerDashboardScreen />);
    await screen.findByText("Sam Volunteer");

    await fireEvent.changeText(screen.getByPlaceholderText("Search volunteers..."), "Sam");
    expect(screen.queryByText("Lee Volunteer")).toBeNull();

    // Back from signing off a skill: the refetch is still in flight, and the list
    // must stay visible rather than flashing back to the first-load spinner.
    let resolveRefresh: (v: TrainingVolunteerSummary[]) => void = () => {};
    mockedGetVolunteers.mockReturnValueOnce(new Promise((resolve) => (resolveRefresh = resolve)));
    await act(async () => mockRefocus());
    expect(mockedGetVolunteers).toHaveBeenCalledTimes(2);
    expect(screen.getByText("1 of 4 skills completed")).toBeTruthy();

    await act(async () => resolveRefresh([volunteer(1, "Sam", 2), volunteer(2, "Lee", 0)]));
    expect(await screen.findByText("2 of 4 skills completed")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search volunteers...").props.value).toBe("Sam");
    expect(screen.queryByText("Lee Volunteer")).toBeNull();
  });

  it("shows an error message when volunteers can't be loaded", async () => {
    mockedGetVolunteers.mockRejectedValue(new Error("network"));
    await render(<TrainerDashboardScreen />);
    expect(await screen.findByText("Couldn't load volunteers. Go back and try again.")).toBeTruthy();
  });
});
