import { bookVacancy, BookingRejectedError } from "../src/services/vacancies";

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
  it("turns a 400, 404 or 409 into a BookingRejectedError with the backend's reason", async () => {
    for (const status of [400, 404, 409]) {
      mockFetchResponse(status, '{"message":"This shift is already full."}');

      const error = (await bookVacancy(7).catch((e: unknown) => e)) as BookingRejectedError;

      expect(error).toBeInstanceOf(BookingRejectedError);
      expect(error.backendMessage).toBe("This shift is already full.");
    }
  });
});
