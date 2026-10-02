import { loginRequest } from "../app/lib/api/auth";

//--------------------HELPERS--------------------//

function mockFetchResponse(status: number, body: string) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

//--------------------TESTS--------------------//

describe("loginRequest", () => {
  it("posts the trimmed email and the password to /api/Auth/login", async () => {
    const fetchMock = mockFetchResponse(200, '{"token":"jwt-token","role":"Admin"}');

    const result = await loginRequest("  admin@sanccob.co.za  ", " secret ");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/Auth/login");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "admin@sanccob.co.za", password: " secret " });
    expect(result).toEqual({ token: "jwt-token", role: "Admin" });
  });

  it('400/401 show the backend message or "Invalid email or password"; 500 shows "Login failed (500)"', async () => {
    mockFetchResponse(401, '{"message":"Account is locked."}');
    await expect(loginRequest("admin@sanccob.co.za", "wrong")).rejects.toThrow("Account is locked.");

    mockFetchResponse(400, "{}");
    await expect(loginRequest("admin@sanccob.co.za", "wrong")).rejects.toThrow("Invalid email or password");

    mockFetchResponse(500, "{}");
    await expect(loginRequest("admin@sanccob.co.za", "secret")).rejects.toThrow("Login failed (500)");
  });
});

//----------------------------------- END OF FILE ---------------------------------//
