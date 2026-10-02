import {
  approveShiftRequest,
  createVolunteer,
  declineShiftRequest,
  fetchShiftRequests,
  fetchVolunteers,
  updateVolunteer,
} from "../app/lib/api/volunteers";

//--------------------HELPERS--------------------//

function mockFetchResponse(status: number, body: unknown = "") {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(text),
    text: async () => text,
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function sentRequest(fetchMock: jest.Mock) {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined };
}

//--------------------TESTS--------------------//

describe("volunteers API", () => {
  it('volunteer list mapping: name, initials and id fallbacks; nulls become ""', async () => {
    mockFetchResponse(200, [
      { userId: 7, firstName: "Sam", lastName: "Volunteer", email: "sam@x.com", phoneNumber: null, weeklyHours: 4, attendanceRate: 90 },
      { email: "lee@x.com", firstName: null, lastName: null },
      {},
    ]);

    const [sam, emailOnly, empty] = await fetchVolunteers("jwt-token");

    expect(sam).toMatchObject({ id: "7", name: "Sam Volunteer", initials: "SV", phone: "", nationality: "", weeklyHours: 4, attendanceRate: 90 });
    expect(emailOnly).toMatchObject({ id: "lee@x.com", name: "lee@x.com", initials: "L", firstName: "", lastName: "" });
    expect(empty).toMatchObject({ name: "Volunteer", initials: "V", email: "", weeklyHours: 0, attendanceRate: 0 });
  });

  it("create sends exactly the 6 fields, trimmed, with blanks as null", async () => {
    const fetchMock = mockFetchResponse(200, "{}");

    await createVolunteer("jwt-token", {
      firstName: "  Thandi ",
      lastName: " Mokoena  ",
      email: " thandi@x.com ",
      phoneNumber: "   ",
      nationality: "",
      ageBracket: "",
    });

    expect(sentRequest(fetchMock)).toEqual({
      url: "https://api.test/api/admin/volunteers",
      method: "POST",
      body: { firstName: "Thandi", lastName: "Mokoena", email: "thandi@x.com", phoneNumber: null, nationality: null, ageBracket: null },
    });
  });

  it("update sends exactly the 8 fields, trimmed, with blanks as null", async () => {
    const fetchMock = mockFetchResponse(200, "");

    await updateVolunteer("jwt-token", "7", {
      firstName: " Sam ",
      lastName: "Volunteer",
      email: "sam@x.com ",
      phoneNumber: " 0821234567 ",
      nationality: "South African",
      ageBracket: "25-34",
      emergencyContactName: "  ",
      emergencyContactPhone: "",
    });

    expect(sentRequest(fetchMock)).toEqual({
      url: "https://api.test/api/admin/volunteers/7",
      method: "PUT",
      body: {
        firstName: "Sam",
        lastName: "Volunteer",
        email: "sam@x.com",
        phoneNumber: "0821234567",
        nationality: "South African",
        ageBracket: "25-34",
        emergencyContactName: null,
        emergencyContactPhone: null,
      },
    });
  });

  it('change requests: "rejected" becomes Declined, unknown becomes Pending, initials built', async () => {
    mockFetchResponse(200, [
      { requestId: 1, volunteerName: "Sam Volunteer", status: "rejected", shiftDate: "2026-10-05", timeSlot: "08:00-13:00" },
      { requestId: 2, volunteerName: null, status: "something new" },
      { requestId: 3, volunteerName: "Lee", status: "Approved" },
    ]);

    const requests = await fetchShiftRequests("jwt-token");

    expect(requests.map((r) => [r.id, r.status, r.volunteerName, r.volunteerInitials])).toEqual([
      ["1", "Declined", "Sam Volunteer", "SV"],
      ["2", "Pending", "Unknown volunteer", "UV"],
      ["3", "Approved", "Lee", "L"],
    ]);
  });

  it("approve and decline call their PUT endpoints", async () => {
    const approveMock = mockFetchResponse(200);
    await approveShiftRequest("jwt-token", "5");
    expect(sentRequest(approveMock)).toMatchObject({ url: "https://api.test/api/change-requests/5/approve", method: "PUT" });

    const declineMock = mockFetchResponse(200);
    await declineShiftRequest("jwt-token", "6");
    expect(sentRequest(declineMock)).toMatchObject({ url: "https://api.test/api/change-requests/6/decline", method: "PUT" });
  });
});

//----------------------------------- END OF FILE ---------------------------------//
