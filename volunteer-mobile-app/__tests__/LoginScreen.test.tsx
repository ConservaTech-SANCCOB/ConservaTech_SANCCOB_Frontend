import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import LoginScreen from "../src/app/login";
import { login } from "../src/services/auth";
import { ApiError } from "../src/utils/api";
import { showErrorToast } from "../src/utils/toast";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));
jest.mock("../src/services/auth");
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

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(tabs)/home"));
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
});
