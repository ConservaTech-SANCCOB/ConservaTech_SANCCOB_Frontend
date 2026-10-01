import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import ProfileScreen from "../src/app/(tabs)/profile";
import { getMyProfile, updateMyProfile, VolunteerProfile } from "../src/services/profile";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));
jest.mock("../src/services/profile");
jest.mock("../src/services/auth");

const mockedGetProfile = jest.mocked(getMyProfile);
const mockedUpdateProfile = jest.mocked(updateMyProfile);

const PROFILE: VolunteerProfile = {
  firstName: "Sam",
  lastName: "Volunteer",
  email: "sam@example.com",
  phoneNumber: "0821234567",
  nationality: "South African",
  ageBracket: "25-34",
  emergencyContactName: "Alex Volunteer",
  emergencyContactPhone: "0831234567",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

describe("Profile", () => {
  it("shows a retry instead of the form when the profile can't be loaded, so nothing can be saved", async () => {
    mockedGetProfile.mockRejectedValue(new Error("network"));
    await render(<ProfileScreen />);

    expect(await screen.findByText("Try again")).toBeTruthy();
    expect(screen.queryByText("Save Changes")).toBeNull();
    expect(screen.queryByText("EMAIL ADDRESS")).toBeNull();
    expect(mockedUpdateProfile).not.toHaveBeenCalled();
    expect(screen.getByText("Log Out")).toBeTruthy();
    expect(screen.getByText("volunteers@sanccob.co.za")).toBeTruthy();
  });

  it("loads the form after a successful retry", async () => {
    mockedGetProfile.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(PROFILE);
    await render(<ProfileScreen />);

    await fireEvent.press(await screen.findByText("Try again"));

    expect(await screen.findByText("Save Changes")).toBeTruthy();
    expect(screen.getByDisplayValue("sam@example.com")).toBeTruthy();
    expect(screen.queryByText("Try again")).toBeNull();
    expect(mockedGetProfile).toHaveBeenCalledTimes(2);
  });

  it("saves the loaded details with the edited fields", async () => {
    mockedGetProfile.mockResolvedValue(PROFILE);
    mockedUpdateProfile.mockResolvedValue(undefined);
    await render(<ProfileScreen />);

    await fireEvent.changeText(await screen.findByDisplayValue("0821234567"), " 0829999999 ");
    await fireEvent.press(screen.getByText("Save Changes"));

    expect(mockedUpdateProfile).toHaveBeenCalledWith({
      email: "sam@example.com",
      phoneNumber: "0829999999",
      nationality: "South African",
      ageBracket: "25-34",
      emergencyContactName: "Alex Volunteer",
      emergencyContactPhone: "0831234567",
    });
    expect(Alert.alert).toHaveBeenCalledWith("Saved", "Your profile has been updated.");
  });
});
