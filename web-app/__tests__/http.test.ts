import { apiFetch, ApiError, registerUnauthorizedHandler } from "../app/lib/api/http";

//--------------------HELPERS--------------------//

function mockFetchResponse(status: number, body = "") {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body),
    text: async () => body,
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

async function errorFrom(promise: Promise<unknown>) {
  return (await promise.catch((error: unknown) => error)) as ApiError;
}

//--------------------TESTS--------------------//

describe("apiFetch", () => {
  it("sends the Bearer token and JSON content type to the API URL, keeping the caller's method and body", async () => {
    const fetchMock = mockFetchResponse(200, '{"saved":true}');

    const result = await apiFetch("/api/Shifts", "abc123", { method: "POST", body: '{"location":"Pen A"}' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/Shifts");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"location":"Pen A"}');
    expect(init.headers.get("Authorization")).toBe("Bearer abc123");
    expect(init.headers.get("Content-Type")).toBe("application/json");
    expect(result).toEqual({ saved: true });
  });

  it("with no token, throws a 401 ApiError and never calls fetch", async () => {
    const error = await errorFrom(apiFetch("/api/Shifts", null));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("a missing NEXT_PUBLIC_API_URL throws a clear error", async () => {
    const savedUrl = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    let isolatedApiFetch: typeof apiFetch = apiFetch;
    jest.isolateModules(() => {
      isolatedApiFetch = require("../app/lib/api/http").apiFetch;
    });
    process.env.NEXT_PUBLIC_API_URL = savedUrl;

    await expect(isolatedApiFetch("/api/Shifts", "abc123")).rejects.toThrow(
      "NEXT_PUBLIC_API_URL is not defined in environment variables"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("error message uses the backend's message, else its title", async () => {
    mockFetchResponse(400, '{"message":"Email is already in use.","title":"Bad Request"}');
    expect((await errorFrom(apiFetch("/api/x", "abc123"))).message).toBe("Email is already in use.");

    mockFetchResponse(400, '{"title":"Bad Request"}');
    expect((await errorFrom(apiFetch("/api/x", "abc123"))).message).toBe("Bad Request");
  });

  it("joins ASP.NET validation errors, else uses the fallback (including non-JSON bodies)", async () => {
    mockFetchResponse(400, '{"errors":{"Email":["Email is required."],"Phone":["Phone is invalid."]}}');
    expect((await errorFrom(apiFetch("/api/x", "abc123"))).message).toBe("Email is required. Phone is invalid.");

    mockFetchResponse(502, "<html>Bad gateway</html>");
    const error = await errorFrom(apiFetch("/api/x", "abc123", {}, "Unable to load shifts"));
    expect(error.message).toBe("Unable to load shifts");
    expect(error.status).toBe(502);
  });

  it("a backend 401 triggers the registered logout handler", async () => {
    const onUnauthorized = jest.fn();
    registerUnauthorizedHandler(onUnauthorized);
    mockFetchResponse(401, '{"message":"Token expired"}');

    const error = await errorFrom(apiFetch("/api/x", "abc123"));

    expect(error.status).toBe(401);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("a 403 or 500 doesn't log out", async () => {
    const onUnauthorized = jest.fn();
    registerUnauthorizedHandler(onUnauthorized);

    mockFetchResponse(403, '{"message":"Forbidden"}');
    expect((await errorFrom(apiFetch("/api/x", "abc123"))).status).toBe(403);
    mockFetchResponse(500, '{"message":"Server error"}');
    expect((await errorFrom(apiFetch("/api/x", "abc123"))).status).toBe(500);

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("204 and empty bodies resolve as undefined; a non-JSON success returns text", async () => {
    mockFetchResponse(204);
    await expect(apiFetch("/api/x", "abc123", { method: "DELETE" })).resolves.toBeUndefined();

    mockFetchResponse(200, "");
    await expect(apiFetch("/api/x", "abc123", { method: "PUT" })).resolves.toBeUndefined();

    mockFetchResponse(200, "Saved");
    await expect(apiFetch("/api/x", "abc123")).resolves.toBe("Saved");
  });
});

//----------------------------------- END OF FILE ---------------------------------//
