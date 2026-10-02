import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../app/authentication/login/page";
import { useAuth } from "../app/lib/auth-context";

jest.mock("../app/lib/auth-context");
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: mockReplace, push: mockPush }) }));

//--------------------HELPERS--------------------//

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLogin = jest.fn();

function mockSession(token: string | null) {
  jest.mocked(useAuth).mockReturnValue({
    token,
    role: token ? "Admin" : null,
    isLoading: false,
    user: null,
    login: mockLogin,
    logout: jest.fn(),
  });
}

async function fillAndSubmit(email: string, password: string, keepSignedIn: boolean) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email address"), email);
  await user.type(screen.getByLabelText("Password"), password);
  if (keepSignedIn) await user.click(screen.getByLabelText(/keep me signed/i));
  await user.click(screen.getByRole("button", { name: "Sign In" }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

//--------------------TESTS--------------------//

describe("LoginPage", () => {
  it("submits the trimmed email and keep-signed-in choice, then goes to /dashboard", async () => {
    mockSession(null);
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    await fillAndSubmit("  admin@sanccob.co.za  ", "secret", true);

    expect(mockLogin).toHaveBeenCalledWith("admin@sanccob.co.za", "secret", true);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("shows the login error and stays on the page", async () => {
    mockSession(null);
    mockLogin.mockRejectedValue(new Error("Invalid email or password"));
    render(<LoginPage />);

    await fillAndSubmit("admin@sanccob.co.za", "wrong", false);

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(mockLogin).toHaveBeenCalledWith("admin@sanccob.co.za", "wrong", false);
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled();
  });

  it("an already signed-in user is sent to /dashboard", () => {
    mockSession("jwt-token");

    render(<LoginPage />);

    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    expect(screen.queryByRole("button", { name: "Sign In" })).not.toBeInTheDocument();
  });
});

//----------------------------------- END OF FILE ---------------------------------//
