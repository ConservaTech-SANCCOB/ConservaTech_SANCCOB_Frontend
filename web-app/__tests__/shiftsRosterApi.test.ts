import { ApiError } from "../app/lib/api/http";
import { generateAutomatedRoster, publishRoster, updateAttendanceStatus } from "../app/lib/api/roster";
import { deleteShift, fetchShiftsByLocation, fetchShiftsForWeek, fetchVacancies } from "../app/lib/api/shifts";

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

function lastRequest(fetchMock: jest.Mock) {
  const [url, init] = fetchMock.mock.calls.at(-1);
  return { url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined };
}

//--------------------TESTS--------------------//

describe("shifts API", () => {
  it("deleting a shift linked to the roster (409) gives the friendly message; other errors pass through", async () => {
    mockFetchResponse(409, '{"message":"FK_RosterAssignments_Shifts"}');
    await expect(deleteShift("jwt-token", 7)).rejects.toThrow(
      "This shift can't be deleted because it's already linked to roster assignments."
    );

    mockFetchResponse(500, '{"message":"Database timeout"}');
    const error = await deleteShift("jwt-token", 7).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
  });

  it("week and location queries are URL-encoded; non-array responses become []", async () => {
    const weekMock = mockFetchResponse(200, "[]");
    await fetchShiftsForWeek("jwt-token", "2026-10-05");
    expect(lastRequest(weekMock).url).toBe("https://api.test/api/Shifts/week?weekStartDate=2026-10-05");

    const locationMock = mockFetchResponse(200, "[]");
    await fetchShiftsByLocation("jwt-token", "Pen A/B");
    expect(lastRequest(locationMock).url).toBe("https://api.test/api/Shifts/location/Pen%20A%2FB");

    mockFetchResponse(200, '{"unexpected":true}');
    await expect(fetchVacancies("jwt-token")).resolves.toEqual([]);
  });
});

// ------------------------------------------------------------ //

describe("roster API", () => {
  it("generating sends only weekStartDate; publishing uses PATCH", async () => {
    const generateMock = mockFetchResponse(200, '{"rosterId":12}');
    await generateAutomatedRoster("jwt-token", { weekStartDate: "2026-10-05" });
    expect(lastRequest(generateMock)).toEqual({
      url: "https://api.test/api/Rosters/generate",
      method: "POST",
      body: { weekStartDate: "2026-10-05" },
    });

    const publishMock = mockFetchResponse(200, '{"rosterId":12,"status":"Published"}');
    await publishRoster("jwt-token", 12);
    expect(lastRequest(publishMock)).toMatchObject({ url: "https://api.test/api/Rosters/12/publish", method: "PATCH" });
  });

  it("saving attendance sends PUT { attended }", async () => {
    const fetchMock = mockFetchResponse(200);

    await updateAttendanceStatus("jwt-token", 42, true);

    expect(lastRequest(fetchMock)).toEqual({
      url: "https://api.test/api/Attendance/42",
      method: "PUT",
      body: { attended: true },
    });
  });
});

//----------------------------------- END OF FILE ---------------------------------//
