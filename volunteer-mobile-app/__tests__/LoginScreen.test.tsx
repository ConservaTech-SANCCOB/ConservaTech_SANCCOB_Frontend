import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import LoginScreen from "../src/app/login";
import { login } from "../src/services/auth";
import { ApiError } from "../src/utils/api";
import { resetTo } from "../src/utils/navigation";
import { showErrorToast } from "../src/utils/toast";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: mockBack, canGoBack: mockCanGoBack }),
}));
jest.mock("../src/services/auth");
jest.mock("../src/utils/navigation");
jest.mock("../src/utils/toast");

const mockedLogin = jest.mocked(login);

async function submit(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText("Email address"), email);
  await fireEvent.changeText(screen.getByLabelText("Password"), password);
  await fireEvent.press(screen.getByText("Log In"));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LoginScreen", () => {
  it("goes to the home tab after a successful login", async () => {
    mockedLogin.mockResolvedValue(undefined as never);
    await render(<LoginScreen />);

    await submit("sam@example.com", "secret123");

    await waitFor(() => expect(resetTo).toHaveBeenCalledWith("/(tabs)/home"));
    expect(mockedLogin).toHaveBeenCalledWith("sam@example.com", "secret123");
  });

  it("maps a 401 to a clear wrong-credentials message", async () => {
    mockedLogin.mockRejectedValue(new ApiError(401, ""));
    await render(<LoginScreen />);

    await submit("sam@example.com", "wrong");

    await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith("Login failed", "Incorrect email or password"));
  });

  it("shows the backend's own message for other 4xx errors", async () => {
    mockedLogin.mockRejectedValue(new ApiError(400, '{"message":"This account has not been activated yet."}'));
    await render(<LoginScreen />);

    await submit("sam@example.com", "secret123");

    await waitFor(() =>
      expect(showErrorToast).toHaveBeenCalledWith("Login failed", "This account has not been activated yet.")
    );
  });

  it("does not call the API when fields are empty", async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByText("Log In"));
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it("goes back to the welcome screen when there's no history (e.g. after a session expired)", async () => {
    mockCanGoBack.mockReturnValueOnce(false);
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByText("Back to options"));
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("pops back normally when opened from the welcome screen", async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByText("Back to options"));
    expect(mockBack).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
