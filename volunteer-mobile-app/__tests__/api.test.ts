import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  api,
  ApiError,
  clearToken,
  getErrorMessage,
  getErrorStatus,
  parseBackendMessage,
  saveToken,
  SessionExpiredError,
} from "../src/utils/api";

jest.mock("expo-router", () => ({ router: { replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));

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

beforeEach(async () => {
  jest.clearAllMocks();
  await clearToken();
});

describe("parseBackendMessage", () => {
  it("reads message, then ProblemDetails detail, then the first validation error, else null", () => {
    expect(parseBackendMessage('{"message":"Password must be at least 8 characters."}')).toBe(
      "Password must be at least 8 characters."
    );
    expect(parseBackendMessage('{"title":"Bad Request","detail":"Shift is full."}')).toBe("Shift is full.");
    expect(parseBackendMessage('{"errors":{"AgeBracket":["Invalid age bracket."]}}')).toBe("Invalid age bracket.");
    expect(parseBackendMessage("<html>Bad gateway</html>")).toBeNull();
    expect(parseBackendMessage("")).toBeNull();
    expect(parseBackendMessage('{"message":"   "}')).toBeNull();
  });
});

describe("getErrorMessage", () => {
  it("shows the backend message for a 4xx but never a 5xx body", () => {
    const clientError = new ApiError(400, '{"message":"Email is already in use."}');
    expect(getErrorMessage(clientError, "fallback")).toBe("Email is already in use.");

    const serverError = new ApiError(500, '{"message":"NullReferenceException at Foo.Bar()"}');
    expect(getErrorMessage(serverError, "fallback")).toBe("fallback");
  });
});

describe("request()", () => {
  it("attaches the saved token as a bearer header", async () => {
    await saveToken("abc123");
    const fetchMock = mockFetchResponse(200, "{}");

    await api.get("/api/volunteers/me/profile");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/volunteers\/me\/profile$/);
    expect(init.headers.Authorization).toBe("Bearer abc123");
  });

  it("throws an ApiError carrying the backend message on a 400", async () => {
    mockFetchResponse(400, '{"message":"Invalid age bracket."}');

    const error = await api.put<never>("/api/volunteers/me/profile", {}).catch((e: ApiError) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.backendMessage).toBe("Invalid age bracket.");
    expect(getErrorStatus(error)).toBe(400);
  });

  it("clears the token and redirects to login on a 401", async () => {
    await saveToken("expired");
    mockFetchResponse(401);

    await expect(api.get("/api/shifts")).rejects.toBeInstanceOf(SessionExpiredError);

    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("does not redirect on a 401 when skipSessionRedirect is set", async () => {
    mockFetchResponse(401, '{"message":"Incorrect PIN."}');

    const error = await api.post("/api/trainers/verify-pin", { pin: "000000" }, { skipSessionRedirect: true }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("treats an empty 200 and a 204 both as success", async () => {
    mockFetchResponse(200, "");
    await expect(api.put("/api/volunteers/me/profile", {})).resolves.toBeUndefined();

    mockFetchResponse(204);
    await expect(api.patch("/api/notifications/1/read", {})).resolves.toBeUndefined();
  });
});
