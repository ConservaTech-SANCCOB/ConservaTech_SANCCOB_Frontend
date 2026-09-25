import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import TrainingScreen from "../src/app/(tabs)/progress/index";
import { getMyTrainingProfile, TrainingSkillDto, TrainingVolunteerProfile } from "../src/services/training";

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    router: { replace: jest.fn() },
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
  };
});
jest.mock("../src/services/training");

const mockedGetProfile = jest.mocked(getMyTrainingProfile);

function skill(skillId: number, skillName: string, signedOffBy?: string): TrainingSkillDto {
  return {
    skillId,
    skillName,
    category: null,
    isSignedOff: Boolean(signedOffBy),
    trainerId: signedOffBy ? 1 : null,
    trainerName: signedOffBy ?? null,
    signedOffAt: signedOffBy ? "2026-09-20T10:00:00Z" : null,
  };
}

function profile(overrides: Partial<TrainingVolunteerProfile> = {}): TrainingVolunteerProfile {
  return {
    userId: 7,
    firstName: "Sam",
    lastName: "Volunteer",
    completedRequiredSkills: 1,
    totalRequiredSkills: 4,
    progressPercentage: 25,
    trainingStatus: "In Training",
    supportingAreas: [skill(1, "Laundry", "Alex Trainer"), skill(2, "Cleaning Station")],
    penRoutines: [skill(3, "Bird Handling")],
    seasonalSkills: [skill(4, "Chick Rearing")],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

describe("Training tab", () => {
  it("shows the volunteer's real skills and the backend's progress numbers", async () => {
    mockedGetProfile.mockResolvedValue(profile());

    await render(<TrainingScreen />);

    expect(await screen.findByText("Laundry")).toBeOnTheScreen();
    expect(screen.getByText("Cleaning Station")).toBeOnTheScreen();
    expect(screen.getByText("Bird Handling")).toBeOnTheScreen();
    expect(screen.getByText("Chick Rearing")).toBeOnTheScreen();
    expect(screen.getByText("Seasonal Skills")).toBeOnTheScreen();
    expect(screen.getByText("0 of 1 completed")).toBeOnTheScreen();
    expect(screen.getByText("1 of 4")).toBeOnTheScreen();
    expect(screen.getByText("25%")).toBeOnTheScreen();
  });

  it("keeps Pen Routines locked until every Supporting Area is signed off", async () => {
    mockedGetProfile.mockResolvedValue(profile());
    await render(<TrainingScreen />);
    expect(await screen.findByText("Complete Supporting Areas to unlock these skills")).toBeOnTheScreen();
  });

  it("unlocks Pen Routines once Supporting Areas are all signed off", async () => {
    mockedGetProfile.mockResolvedValue(
      profile({ supportingAreas: [skill(1, "Laundry", "Alex Trainer"), skill(2, "Cleaning Station", "Alex Trainer")] })
    );
    await render(<TrainingScreen />);
    expect(await screen.findByText("Bird Handling")).toBeOnTheScreen();
    expect(screen.queryByText("Complete Supporting Areas to unlock these skills")).toBeNull();
  });

  it("tells the volunteer who signed a skill off", async () => {
    mockedGetProfile.mockResolvedValue(profile());
    await render(<TrainingScreen />);

    await fireEvent.press(await screen.findByText("Laundry"));

    expect(Alert.alert).toHaveBeenCalledWith("Laundry", expect.stringMatching(/^Signed off by Alex Trainer on /));
  });

  it("shows an error instead of fake 0% progress when training can't be loaded", async () => {
    mockedGetProfile.mockRejectedValue(new Error("Network request failed"));
    await render(<TrainingScreen />);
    expect(await screen.findByText(/Couldn't load your training progress/)).toBeOnTheScreen();
    expect(screen.queryByText("Laundry")).toBeNull();
  });
});
