import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import LoginScreen from "../src/app/login";
import { login } from "../src/services/auth";
import { ApiError } from "../src/utils/api";
import { resetTo } from "../src/utils/navigation";
import { showErrorToast } from "../src/utils/toast";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => true }),
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
  it("sends the trimmed email and goes to the home tab after a successful login", async () => {
    mockedLogin.mockResolvedValue(undefined as never);
    await render(<LoginScreen />);

    await submit("  sam@example.com  ", "secret123");

    await waitFor(() => expect(resetTo).toHaveBeenCalledWith("/(tabs)/home"));
    expect(mockedLogin).toHaveBeenCalledWith("sam@example.com", "secret123");
  });

  it("maps a 401 to a clear wrong-credentials message and stays on Login", async () => {
    mockedLogin.mockRejectedValue(new ApiError(401, ""));
    await render(<LoginScreen />);

    await submit("sam@example.com", "wrong");

    await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith("Login failed", "Incorrect email or password"));
    expect(resetTo).not.toHaveBeenCalled();
  });
});
