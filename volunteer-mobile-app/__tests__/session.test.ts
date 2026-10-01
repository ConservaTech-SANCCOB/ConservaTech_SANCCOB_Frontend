import * as SecureStore from "expo-secure-store";
import { logout } from "../src/services/auth";
import { signOffTrainingSkill } from "../src/services/training";
import { verifyTrainerPin } from "../src/services/trainers";
import { clearToken, getSessionRole, getToken, saveToken } from "../src/utils/api";

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

beforeEach(async () => {
  jest.clearAllMocks();
  await clearToken();
});

describe("session role", () => {
  it("defaults to a volunteer session", async () => {
    await saveToken("volunteer-token");
    expect(await getSessionRole()).toBe("volunteer");
  });

  it("marks a PIN-verified session as a trainer session", async () => {
    mockFetchResponse(200, '{"message":"ok","token":"trainer-token"}');

    await verifyTrainerPin("123456");

    expect(await getToken()).toBe("trainer-token");
    expect(await getSessionRole()).toBe("trainer");
  });
});

describe("logout", () => {
  it("tells the backend, then clears the session", async () => {
    await saveToken("abc", "trainer");
    const fetchMock = mockFetchResponse(200);

    await logout();

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/Auth\/logout$/);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer abc");
    expect(await getToken()).toBeNull();
    expect(await getSessionRole()).toBe("volunteer");
  });

  it("still clears the session when the backend call fails", async () => {
    await saveToken("abc");
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed")) as unknown as typeof fetch;

    await logout();

    expect(await getToken()).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });
});

describe("signOffTrainingSkill", () => {
  it("sends only the skill — the backend takes the trainer from the session token", async () => {
    const fetchMock = mockFetchResponse(200);

    await signOffTrainingSkill(12, 5);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/training\/volunteers\/12\/sign-off$/);
    expect(JSON.parse(init.body)).toEqual({ skillId: 5 });
  });
});
