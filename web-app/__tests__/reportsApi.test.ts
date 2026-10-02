import { fetchReportsData } from "../app/lib/api/reports";

//--------------------HELPERS--------------------//

const rawReport = {
  totalVolunteerHours: 1240,
  averageAttendanceRate: 87.5,
  missedShifts: 6,
  activeVolunteers: 42,
  monthlyHours: [{ month: "Jan", hours: 120 }],
  monthlyAttendanceRate: [{ month: "Jan", ratePercent: 91 }],
  topContributors: [{ volunteerName: "Sam Volunteer", totalHours: 64 }],
};

const rawConservation = { totalRescued: 300, totalReleased: 240, percentReleased: 80 };

//--------------------TESTS--------------------//

describe("fetchReportsData", () => {
  it("backend report fields are mapped to what the page shows", async () => {
    const fetchMock = jest.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => (url.includes("conservation-impact") ? rawConservation : rawReport),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const report = await fetchReportsData("jwt-token", "2026", "");

    expect(report).toEqual({
      totalVolunteerHours: 1240,
      avgAttendanceRate: 87.5,
      missedShifts: 6,
      activeVolunteers: 42,
      monthlyHours: [{ month: "Jan", hours: 120 }],
      conservation: { totalRescued: 300, totalReleased: 240, totalInCare: 0, percentReleased: 80 },
      attendanceByMonth: [{ month: "Jan", rate: 91 }],
      topContributors: [{ name: "Sam Volunteer", hours: 64 }],
    });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.test/api/admin/reports?year=2026");
  });
});

//----------------------------------- END OF FILE ---------------------------------//
