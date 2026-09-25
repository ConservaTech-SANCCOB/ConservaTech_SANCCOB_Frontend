import { bookVacancy, BookingRejectedError } from "../src/services/vacancies";
import { ApiError } from "../src/utils/api";

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));

function mockFetchResponse(status: number, body = "") {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    json: async () => JSON.parse(body),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("bookVacancy", () => {
  it("POSTs to the shift's book endpoint and returns the assignment", async () => {
    const fetchMock = mockFetchResponse(
      200,
      '{"rosterAssignmentId":42,"shiftId":7,"status":"Assigned","message":null}'
    );

    const result = await bookVacancy(7);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/vacancies\/7\/book$/);
    expect(init.method).toBe("POST");
    expect(result.rosterAssignmentId).toBe(42);
  });

  it.each([400, 404, 409])("turns a %i into a BookingRejectedError with the backend's reason", async (status) => {
    mockFetchResponse(status, '{"message":"This shift is already full."}');

    const error = (await bookVacancy(7).catch((e: unknown) => e)) as BookingRejectedError;

    expect(error).toBeInstanceOf(BookingRejectedError);
    expect(error.backendMessage).toBe("This shift is already full.");
  });

  it("leaves backendMessage null when the rejection has no readable body", async () => {
    mockFetchResponse(409, "");

    const error = (await bookVacancy(7).catch((e: unknown) => e)) as BookingRejectedError;

    expect(error).toBeInstanceOf(BookingRejectedError);
    expect(error.backendMessage).toBeNull();
  });

  it("passes server errors through untouched rather than calling them rejections", async () => {
    mockFetchResponse(500, '{"message":"Database timeout"}');

    const error = await bookVacancy(7).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(BookingRejectedError);
  });
});
