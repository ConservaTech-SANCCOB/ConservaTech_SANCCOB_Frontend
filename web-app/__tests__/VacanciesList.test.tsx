import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Vacancy } from "../app/lib/api/shifts";
import { useAuth } from "../app/lib/auth-context";
import VacanciesList from "../components/VacanciesList";

jest.mock("../app/lib/auth-context");

//--------------------HELPERS--------------------//

const VACANCY: Vacancy = {
  shiftId: 7,
  shiftDate: "2026-10-05",
  timeSlot: "08:00-13:00",
  location: "Penguin Pens",
  birdCount: 50,
  capacity: 2,
  assignedVolunteers: 1,
  vacanciesAvailable: 1,
  requiredSkillIds: [3],
};

function mockFetchStatus(ok: boolean) {
  const fetchMock = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => ({}) });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    token: "jwt-token",
    role: "Admin",
    isLoading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  });
});

//--------------------TESTS--------------------//

describe("VacanciesList", () => {
  it("Notify Qualified sends the vacancy details with the token, and alerts on failure", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchStatus(true);
    render(<VacanciesList vacancies={[VACANCY]} onRefresh={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: /Notify Qualified/ }));

    expect(await screen.findByText("Notification dispatched to qualifying volunteers for Shift #7")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/notifications/broadcast-vacancy");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer jwt-token");
    expect(JSON.parse(init.body)).toEqual({
      shiftId: 7,
      requiredSkillIds: [3],
      title: "New Shift Vacancy Available!",
      message: "A vacancy opened up for Penguin Pens on 2026-10-05 (08:00-13:00).",
    });

    mockFetchStatus(false);
    await user.click(screen.getByRole("button", { name: /Notify Qualified/ }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Unable to send vacancy notification. Please verify backend notification endpoints."
      )
    );
  });
});

//----------------------------------- END OF FILE ---------------------------------//
