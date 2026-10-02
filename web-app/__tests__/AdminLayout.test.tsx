import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminLayout from "../app/(admin)/layout";
import { useAuth } from "../app/lib/auth-context";

jest.mock("../app/lib/auth-context");
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("@/components/layout/sidebar", () => ({ __esModule: true, default: () => <nav>Sidebar</nav> }));
jest.mock("@/components/layout/topbar", () => ({ Topbar: () => <header>Topbar</header> }));

//--------------------HELPERS--------------------//

const mockReplace = jest.fn();
const mockLogout = jest.fn();

function signInAs(session: { token: string | null; role: string | null; isLoading?: boolean }) {
  jest.mocked(useAuth).mockReturnValue({
    token: session.token,
    role: session.role,
    isLoading: session.isLoading ?? false,
    user: null,
    login: jest.fn(),
    logout: mockLogout,
  });
}

function renderLayout() {
  return render(
    <AdminLayout>
      <p>Volunteer records</p>
    </AdminLayout>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

//--------------------TESTS--------------------//

describe("AdminLayout", () => {
  it("while the session is loading, renders nothing and doesn't redirect", () => {
    signInAs({ token: null, role: null, isLoading: true });

    const { container } = renderLayout();

    expect(container).toBeEmptyDOMElement();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("signed-out users are redirected to login", () => {
    signInAs({ token: null, role: null });

    renderLayout();

    expect(mockReplace).toHaveBeenCalledWith("/authentication/login");
    expect(screen.queryByText("Volunteer records")).not.toBeInTheDocument();
  });

  it('a non-admin sees "No access" and can log out', async () => {
    signInAs({ token: "jwt-token", role: "Trainer" });

    renderLayout();

    expect(screen.getByText("No access")).toBeInTheDocument();
    expect(screen.queryByText("Volunteer records")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('an admin ("Admin" or "admin") sees the page', () => {
    for (const role of ["Admin", "admin"]) {
      signInAs({ token: "jwt-token", role });

      const { unmount } = renderLayout();

      expect(screen.getByText("Volunteer records")).toBeInTheDocument();
      expect(screen.getByText("Sidebar")).toBeInTheDocument();
      expect(screen.queryByText("No access")).not.toBeInTheDocument();
      unmount();
    }
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

//----------------------------------- END OF FILE ---------------------------------//
