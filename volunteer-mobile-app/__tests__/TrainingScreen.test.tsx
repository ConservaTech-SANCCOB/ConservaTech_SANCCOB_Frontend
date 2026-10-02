import { render, screen } from "@testing-library/react-native";
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
});

describe("Training tab", () => {
  it("keeps Pen Routines locked until every Supporting Area is signed off, then unlocks them", async () => {
    mockedGetProfile.mockResolvedValue(profile());
    const { unmount } = await render(<TrainingScreen />);
    expect(await screen.findByText("Complete Supporting Areas to unlock these skills")).toBeOnTheScreen();
    await unmount();

    mockedGetProfile.mockResolvedValue(
      profile({ supportingAreas: [skill(1, "Laundry", "Alex Trainer"), skill(2, "Cleaning Station", "Alex Trainer")] })
    );
    await render(<TrainingScreen />);
    expect(await screen.findByText("Bird Handling")).toBeOnTheScreen();
    expect(screen.queryByText("Complete Supporting Areas to unlock these skills")).toBeNull();
  });

  it("shows an error instead of fake 0% progress when training can't be loaded", async () => {
    mockedGetProfile.mockRejectedValue(new Error("Network request failed"));
    await render(<TrainingScreen />);
    expect(await screen.findByText(/Couldn't load your training progress/)).toBeOnTheScreen();
    expect(screen.queryByText("Laundry")).toBeNull();
  });
});
