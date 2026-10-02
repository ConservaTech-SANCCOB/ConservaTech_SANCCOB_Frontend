import { act, renderHook, waitFor } from "@testing-library/react";
import { apiFetch } from "../app/lib/api/http";
import { AuthProvider, useAuth } from "../app/lib/auth-context";

//--------------------HELPERS--------------------//

const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
const EMAIL_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

function base64Url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Fake JWT so the test never hits the real API
function fakeJwt(claims: Record<string, unknown> = {}) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url({ exp, ...claims })}.signature`;
}

function mockFetch(handler: (url: string) => { status: number; body: string }) {
  const fetchMock = jest.fn(async (url: string) => {
    const { status, body } = handler(url);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => JSON.parse(body),
      text: async () => body,
    };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function mockLoginResponse(body: object) {
  return mockFetch(() => ({ status: 200, body: JSON.stringify(body) }));
}

// ------------------------------------------------------------ //

async function renderAuth() {
  const view = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

function storedTokens() {
  return {
    local: localStorage.getItem("auth_token"),
    session: sessionStorage.getItem("auth_token"),
  };
}

//--------------------TESTS--------------------//

describe("AuthProvider login", () => {
  it('"keep me signed in" stores the session in localStorage', async () => {
    const token = fakeJwt();
    mockLoginResponse({ token, role: "Admin" });
    const { result } = await renderAuth();

    await act(() => result.current.login("admin@sanccob.co.za", "secret", true));

    expect(localStorage.getItem("auth_token")).toBe(token);
    expect(localStorage.getItem("user_role")).toBe("Admin");
    expect(sessionStorage.getItem("auth_token")).toBeNull();
    expect(result.current.token).toBe(token);
    expect(result.current.role).toBe("Admin");
  });

  it("otherwise uses sessionStorage and clears any old localStorage session", async () => {
    localStorage.setItem("auth_token", "old-token");
    localStorage.setItem("user_role", "Admin");
    const token = fakeJwt();
    mockLoginResponse({ token, role: "Admin" });
    const { result } = await renderAuth();

    await act(() => result.current.login("admin@sanccob.co.za", "secret", false));

    expect(storedTokens()).toEqual({ local: null, session: token });
    expect(localStorage.getItem("user_role")).toBeNull();
    expect(sessionStorage.getItem("user_role")).toBe("Admin");
  });

  it("a login response missing the token or role is rejected and nothing is stored", async () => {
    const { result } = await renderAuth();

    mockLoginResponse({ token: null, role: "Admin" });
    await expect(result.current.login("admin@sanccob.co.za", "secret", true)).rejects.toThrow(
      "Login failed. Please try again."
    );

    mockLoginResponse({ token: fakeJwt(), role: null });
    await expect(result.current.login("admin@sanccob.co.za", "secret", true)).rejects.toThrow(
      "Login succeeded but no role was returned"
    );

    expect(storedTokens()).toEqual({ local: null, session: null });
    expect(result.current.token).toBeNull();
  });
});

// ------------------------------------------------------------ //

describe("AuthProvider session restore", () => {
  it("restores a valid saved token and role on load", async () => {
    const token = fakeJwt();
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_role", "Admin");

    const { result } = await renderAuth();

    expect(result.current.token).toBe(token);
    expect(result.current.role).toBe("Admin");
  });

  it("clears an expired or malformed saved token", async () => {
    const expired = fakeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    localStorage.setItem("auth_token", expired);
    localStorage.setItem("user_role", "Admin");
    const first = await renderAuth();
    expect(first.result.current.token).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("user_role")).toBeNull();
    first.unmount();

    sessionStorage.setItem("auth_token", "not-a-jwt");
    const second = await renderAuth();
    expect(second.result.current.token).toBeNull();
    expect(sessionStorage.getItem("auth_token")).toBeNull();
  });

  it("reads name and email from the token, including .NET's long claim names", async () => {
    localStorage.setItem("auth_token", fakeJwt({ [NAME_CLAIM]: "Cathy Adams", [EMAIL_CLAIM]: "cathy@sanccob.co.za" }));
    localStorage.setItem("user_role", "Admin");

    const { result } = await renderAuth();

    expect(result.current.user).toEqual({ name: "Cathy Adams", email: "cathy@sanccob.co.za" });
  });
});

// ------------------------------------------------------------ //

describe("AuthProvider logout", () => {
  it("logout clears storage and calls /api/Auth/logout with the old token", async () => {
    const token = fakeJwt();
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_role", "Admin");
    const fetchMock = mockFetch(() => ({ status: 200, body: "" }));
    const { result } = await renderAuth();

    act(() => result.current.logout());

    expect(result.current.token).toBeNull();
    expect(storedTokens()).toEqual({ local: null, session: null });
    expect(localStorage.getItem("user_role")).toBeNull();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.test/api/Auth/logout");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: `Bearer ${token}` });
  });

  it("two 401s arriving together log out only once", async () => {
    const token = fakeJwt();
    sessionStorage.setItem("auth_token", token);
    sessionStorage.setItem("user_role", "Admin");
    const fetchMock = mockFetch((url) =>
      url.endsWith("/api/Auth/logout") ? { status: 200, body: "" } : { status: 401, body: '{"message":"Expired"}' }
    );
    const { result } = await renderAuth();

    await act(async () => {
      await Promise.allSettled([apiFetch("/api/Shifts", token), apiFetch("/api/Vacancies", token)]);
    });

    const logoutCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/api/Auth/logout"));
    expect(logoutCalls).toHaveLength(1);
    expect(result.current.token).toBeNull();
    expect(sessionStorage.getItem("auth_token")).toBeNull();
  });
});

//----------------------------------- END OF FILE ---------------------------------//
