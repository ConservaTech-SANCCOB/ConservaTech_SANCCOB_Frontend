"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  fetchVolunteers,
  fetchShiftRequests,
  createVolunteer,
  Volunteer,
  ShiftRequest,
  CreateVolunteerPayload,
  AGE_BRACKETS,
  type AgeBracket,
} from "../../lib/api/volunteers";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ANNUAL_HOURS_TARGET = 1920;

// Returns the Monday of a given week, formatted as YYYY-MM-DD
function getStartOfWeek(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split("T")[0];
}

// e.g. getStartOfWeek + offset 2 -> "Sep 15"
function formatDateLabel(startDateStr: string, dayOffset: number): string {
  const start = new Date(startDateStr);
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + dayOffset);
  return targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Safely calculates half-day & full-day shifts in 12-hour or 24-hour formats
function parseShiftHours(time: string): number {
  if (!time || (!time.includes("–") && !time.includes("-"))) return 0;

  const parts = time.split(/[–-]/).map((t) => t.trim());
  if (parts.length !== 2) return 0;

  const toMinutes = (t: string) => {
    const raw = t.toLowerCase();
    const isPM = raw.includes("pm");
    const isAM = raw.includes("am");
    
    // Extract numbers for hours and optional minutes
    const clean = raw.replace(/[^0-9:]/g, "");
    const [hStr, mStr] = clean.split(":");
    let hours = parseInt(hStr, 10);
    const minutes = mStr ? parseInt(mStr, 10) : 0;

    if (isNaN(hours)) return 0;

    // Convert 12-hour AM/PM to 24-hour minutes
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + (isNaN(minutes) ? 0 : minutes);
  };

  const startMinutes = toMinutes(parts[0]);
  const endMinutes = toMinutes(parts[1]);

  const openingTime = 8 * 60;   // 8:00 AM (480 mins)
  const closingTime = 17 * 60;  // 5:00 PM (1020 mins)

  // Clamp shift window strictly within 8:00 AM – 5:00 PM
  const validStart = Math.max(startMinutes, openingTime);
  const validEnd = Math.min(endMinutes, closingTime);

  const diff = validEnd - validStart;
  return diff > 0 ? diff / 60 : 0;
}

// A volunteer's weekly hours = sum of hours for availability slots the admin has confirmed.
function getWeeklyHours(volunteer: Volunteer): number {
  if (!volunteer.availability) return 0;
  return volunteer.availability
    .filter((slot) => volunteer.confirmedShifts?.includes(slot.day))
    .reduce((total, slot) => total + parseShiftHours(slot.time), 0);
}

export default function VolunteersPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"management" | "requests" | "create">("management");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [viewingVolunteer, setViewingVolunteer] = useState<Volunteer | null>(null);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [schedulingVolunteer, setSchedulingVolunteer] = useState<Volunteer | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    type: "Approved" | "Declined";
    volunteerName: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [vData, rData] = await Promise.all([
          fetchVolunteers(token),
          fetchShiftRequests(token),
        ]);
        setVolunteers(vData);
        setRequests(rData);
      } catch (err) {
        console.error("Failed to load volunteer data from API", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [token]);

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  const handleAction = (id: string, newStatus: "Approved" | "Declined") => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );
  };

  const handleSaveEdit = (updated: Volunteer) => {
    setVolunteers((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    setEditingVolunteer(null);
  };

  const handleToggleShift = (volunteerId: string, day: string) => {
    setVolunteers((prev) =>
      prev.map((v) => {
        if (v.id !== volunteerId) return v;
        const confirmed = v.confirmedShifts || [];
        const isConfirmed = confirmed.includes(day);
        return {
          ...v,
          confirmedShifts: isConfirmed
            ? confirmed.filter((d) => d !== day)
            : [...confirmed, day],
        };
      })
    );
    setSchedulingVolunteer((prev) => {
      if (!prev || prev.id !== volunteerId) return prev;
      const confirmed = prev.confirmedShifts || [];
      const isConfirmed = confirmed.includes(day);
      return {
        ...prev,
        confirmedShifts: isConfirmed
          ? confirmed.filter((d) => d !== day)
          : [...confirmed, day],
      };
    });
  };

  const handleCreate = async (newVolunteer: CreateVolunteerPayload) => {
    const created = await createVolunteer(token, newVolunteer);
    setVolunteers((prev) => [...prev, created]);
    setActiveTab("management");
  };

  const filteredVolunteers = volunteers.filter(
    (v) =>
      (v.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.email || "").toLowerCase().includes(searchQuery.toLowerCase()) 
  );

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Volunteers</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage volunteer profiles and shift change requests
        </p>
      </div>

      {/* Main Pill Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("management")}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "management"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Volunteer Management
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "requests"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Request Change
          {pendingCount > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "create"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Create Volunteer
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">
            Loading volunteer data from API…
          </div>
        ) : activeTab === "management" ? (
          /* TAB 1: VOLUNTEER MANAGEMENT */
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search volunteers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <button className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition-colors">
                  <FilterIcon className="w-3.5 h-3.5 text-slate-500" />
                  Filter
                </button>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {filteredVolunteers.length} volunteers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="pb-3 px-4">Profile</th>
                    <th className="pb-3 px-4">Volunteer Name</th>
                    <th className="pb-3 px-4">Contact Information</th>
                    <th className="pb-3 px-4">Weekly Hours</th>
                    <th className="pb-3 px-4">Attendance</th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No volunteers found.
                      </td>
                    </tr>
                  ) : (
                    filteredVolunteers.map((v) => {
                      const weeklyHours = getWeeklyHours(v);
                      const maxHours = v.maxWeeklyHours || 40;
                      const progressPercentage = (weeklyHours / maxHours) * 100;
                      const confirmedCount = v.confirmedShifts?.length || 0;
                      const totalSlots = v.availability?.length || 0;

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-4 px-4">
                            <div className="w-9 h-9 rounded-full bg-[#0B2447] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                              {v.initials}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                              {v.name}
                            </p>
                          </td>
                          <td className="py-4 px-4 space-y-1">
                            <p className="text-slate-600 text-[11px]">{v.email}</p>
                            <p className="text-slate-400 text-[11px]">{v.phone}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-baseline gap-1">
                              <span className="font-bold text-slate-900">
                                {weeklyHours}/{maxHours}
                              </span>
                              <span className="text-[10px] text-slate-400">hrs</span>
                            </div>
                            <div className="w-28 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => setSchedulingVolunteer(v)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-700 transition-colors"
                            >
                              <CalendarCheckIcon />
                              <span className="text-xs font-semibold">View Attendance</span>
                              {totalSlots > 0 && (
                                <span className="text-[10px] text-slate-400 group-hover:text-blue-500">
                                  {confirmedCount}/{totalSlots}
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-4 text-right space-x-1">
                            <button
                              onClick={() => setViewingVolunteer(v)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              aria-label="View volunteer"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => setEditingVolunteer(v)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              aria-label="Edit volunteer"
                            >
                              <EditNoteIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : activeTab === "requests" ? (
          /* TAB 2: SHIFT CHANGE REQUESTS */
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Pending & Recent Requests</h2>
              <p className="text-xs text-slate-400 mt-0.5">{pendingCount} pending approval</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="pb-3 px-4">Volunteer</th>
                    <th className="pb-3 px-4">Current Date</th>
                    <th className="pb-3 px-4">Current Time</th>
                    <th className="pb-3 px-4">Requested Date</th>
                    <th className="pb-3 px-4">Requested Time</th>
                    <th className="pb-3 px-4">Request Type</th>
                    <th className="pb-3 px-4">Reason</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        No shift requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#0B2447] text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {r.volunteerInitials}
                            </div>
                            <span className="font-medium text-slate-800 text-xs">
                              {r.volunteerName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-700">{r.currentDate}</td>
                        <td className="py-4 px-4 font-medium text-slate-700">{r.currentTime}</td>
                        <td className="py-4 px-4 font-medium text-slate-700">{r.requestedDate}</td>
                        <td className="py-4 px-4 font-medium text-slate-700">{r.requestedTime}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full font-semibold text-[10px] inline-block ${
                              r.requestType === "Cancellation"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}
                          >
                            {r.requestType}
                          </span>
                        </td>
                        <td className="py-4 px-4 max-w-[160px] truncate text-slate-400 font-medium">
                          {r.reason}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full font-semibold text-[10px] inline-block ${
                              r.status === "Approved"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : r.status === "Declined"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-amber-50 text-amber-600 border border-amber-100"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {r.status === "Pending" ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() =>
                                  setConfirmAction({ id: r.id, type: "Approved", volunteerName: r.volunteerName })
                                }
                                className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all font-bold text-xs"
                                title="Approve"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmAction({ id: r.id, type: "Declined", volunteerName: r.volunteerName })
                                }
                                className="w-7 h-7 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all font-bold text-xs"
                                title="Decline"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TAB 3: CREATE VOLUNTEER */
          <CreateVolunteerForm onCreate={handleCreate} onCancel={() => setActiveTab("management")} />
        )}
      </div>

      {/* VIEW MODAL */}
      {viewingVolunteer && (
        <ViewVolunteerModal
          volunteer={viewingVolunteer}
          onClose={() => setViewingVolunteer(null)}
        />
      )}

      {/* EDIT MODAL */}
      {editingVolunteer && (
        <EditVolunteerModal
          volunteer={editingVolunteer}
          onCancel={() => setEditingVolunteer(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* SCHEDULE / ATTENDANCE MODAL */}
      {schedulingVolunteer && (
        <ScheduleModal
          volunteer={schedulingVolunteer}
          onClose={() => setSchedulingVolunteer(null)}
          onToggleShift={(day) => handleToggleShift(schedulingVolunteer.id, day)}
        />
      )}

      {/* CONFIRM APPROVE/DECLINE MODAL */}
      {confirmAction && (
        <ConfirmActionModal
          type={confirmAction.type}
          volunteerName={confirmAction.volunteerName}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            handleAction(confirmAction.id, confirmAction.type);
            setConfirmAction(null);
          }}
        />
      )}
    </div>
  );
}

// ---- Schedule / Attendance Modal ----

function ScheduleModal({
  volunteer,
  onClose,
  onToggleShift,
}: {
  volunteer: Volunteer;
  onClose: () => void;
  onToggleShift: (day: string) => void;
}) {
  const weeklyHours = getWeeklyHours(volunteer);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => getStartOfWeek());

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const selected = new Date(e.target.value);
    setSelectedWeekStart(getStartOfWeek(selected));
  };

  const availabilitySlots = volunteer.availability || [];
  const confirmedShifts = volunteer.confirmedShifts || [];

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-slate-900">{volunteer.name}&apos;s Schedule</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <CloseIcon />
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Confirm which shifts the volunteer actually showed up for this week.
      </p>

      {/* Week Selector */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 mb-5">
        <div className="flex items-center gap-2">
          <CalendarCheckIcon />
          <span className="text-xs font-semibold text-slate-700">Week of:</span>
        </div>
        <input
          type="date"
          value={selectedWeekStart}
          onChange={handleDateChange}
          className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
        />
      </div>

      {availabilitySlots.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No availability set yet.</p>
      ) : (
        <div className="space-y-2 mb-5">
          {availabilitySlots.map((slot) => {
            const dayIndex = ALL_DAYS.indexOf(slot.day);
            const dateLabel = dayIndex !== -1 ? formatDateLabel(selectedWeekStart, dayIndex) : "";
            const isConfirmed = confirmedShifts.includes(slot.day);

            return (
              <button
                key={slot.day}
                onClick={() => onToggleShift(slot.day)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-colors text-left ${
                  isConfirmed
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      isConfirmed ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"
                    }`}
                  >
                    {isConfirmed && <CheckIcon />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{slot.day}</span>
                    {dateLabel && (
                      <span className="text-xs text-slate-400 ml-2">({dateLabel})</span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-500">{slot.time}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-slate-50 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-medium text-slate-600">Confirmed hours this week</span>
        <span className="text-sm font-bold text-slate-900">
          {weeklyHours} / {volunteer.maxWeeklyHours || 40} hrs
        </span>
      </div>
    </ModalOverlay>
  );
}

// ---- Create Volunteer Form (Tab) ----

function CreateVolunteerForm({
  onCreate,
  onCancel,
}: {
  onCreate: (v: CreateVolunteerPayload) => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [ageBracket, setAgeBracket] = useState<AgeBracket | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

   if (!ageBracket) return;

    setIsSubmitting(true);

    try {
      await onCreate({
        firstName,
        lastName,
        email,
        phoneNumber,
        nationality,
        ageBracket, 
      });
    } catch (err) {
      console.error("Failed to create volunteer", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {/* Form Heading */}
      <div>
        <h2 className="font-bold text-slate-900 text-sm">
          Create Volunteer Profile
        </h2>

        <p className="text-xs text-slate-400 mt-0.5">
          Add a new volunteer to the system
        </p>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-4">

        <FormField
          label="First Name"
          value={firstName}
          onChange={setFirstName}
          required
        />

        <FormField
          label="Last Name"
          value={lastName}
          onChange={setLastName}
          required
        />

        <FormField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          required
        />

        <FormField
          label="Phone Number"
          value={phoneNumber}
          onChange={setPhoneNumber}
          required
        />

        <FormField
          label="Nationality"
          value={nationality}
          onChange={setNationality}
          required
        />

        {/* Age Bracket Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Age Bracket
          </label>

          <select
            value={ageBracket}
            onChange={(e) => setAgeBracket(e.target.value as AgeBracket)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
          >
            <option value="" disabled>
              Select age bracket
            </option>

            {AGE_BRACKETS.map((bracket) => (
              <option key={bracket} value={bracket}>
                {bracket}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-2">

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Volunteer"}
        </button>

      </div>
    </form>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
      />
    </div>
  );
}

// ---- View Modal ----

function ViewVolunteerModal({ volunteer, onClose }: { volunteer: Volunteer; onClose: () => void }) {
  const logged = volunteer.annualHoursLogged || 0;
  const annualProgress = Math.min((logged / ANNUAL_HOURS_TARGET) * 100, 100);
  const slots = volunteer.availability || [];

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-900">Volunteer Profile</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <CloseIcon />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-xl bg-blue-700 text-white font-bold flex items-center justify-center text-lg shrink-0">
          {volunteer.initials}
        </div>
        <div>
          <p className="font-bold text-slate-900">{volunteer.name}</p>
          <p className="text-sm text-slate-500">
            {volunteer.nationality || "—"} · {volunteer.ageBracket || "—"}
          </p>
          <p className="text-xs text-slate-400">Joined {volunteer.joinedDate}</p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <ContactRow icon={<MailIcon />} label="Email" value={volunteer.email} />
        <ContactRow icon={<PhoneIcon />} label="Phone" value={volunteer.phone} />
      </div>

      <div className="bg-slate-50 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-600">Hours Logged</span>
          <span className="text-sm font-bold text-slate-900">
            {logged} / {ANNUAL_HOURS_TARGET} hrs
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${annualProgress}%` }} />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">Availability</p>
        {slots.length > 0 ? (
          <div className="space-y-2">
            {slots.map((slot) => (
              <div
                key={slot.day}
                className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
              >
                <span className="text-sm font-semibold text-slate-800">{slot.day}</span>
                <span className="text-sm text-slate-500">{slot.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No availability set yet.</p>
        )}
      </div>
    </ModalOverlay>
  );
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

// ---- Edit Modal ----

function EditVolunteerModal({
  volunteer,
  onCancel,
  onSave,
}: {
  volunteer: Volunteer;
  onCancel: () => void;
  onSave: (updated: Volunteer) => void;
}) {
  const [name, setName] = useState(volunteer.name);
  const [email, setEmail] = useState(volunteer.email);
  const [phone, setPhone] = useState(volunteer.phone);
  const [nationality, setNationality] = useState(
    volunteer.nationality || ""
  );
  const [ageBracket, setAgeBracket] = useState(
    volunteer.ageBracket || ""
  );

  const handleSave = () => {
    onSave({
      ...volunteer,
      name,
      email,
      phone,
      nationality,
      ageBracket,
    });
  };

  return (
    <ModalOverlay onClose={onCancel}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          Edit Volunteer
        </h2>

        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-4 mb-6">

        <FormField
          label="Full Name"
          value={name}
          onChange={setName}
        />

        <FormField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
        />

        <FormField
          label="Phone"
          value={phone}
          onChange={setPhone}
        />

        {/* Age Bracket Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Age Bracket
          </label>

          <select
            value={ageBracket}
            onChange={(e) => setAgeBracket(e.target.value as AgeBracket)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
          >
            <option value="" disabled>
              Select age bracket
            </option>

            {AGE_BRACKETS.map((bracket) => (
              <option key={bracket} value={bracket}>
                {bracket}
              </option>
            ))}
          </select>
        </div>

        <FormField
          label="Nationality"
          value={nationality}
          onChange={setNationality}
        />

      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">

        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors"
        >
          <CheckIcon />
          Save Changes
        </button>

      </div>

    </ModalOverlay>
  );
}
// ---- Confirm Action Modal ----

function ConfirmActionModal({
  type,
  volunteerName,
  onCancel,
  onConfirm,
}: {
  type: "Approved" | "Declined";
  volunteerName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isApprove = type === "Approved";

  return (
    <ModalOverlay onClose={onCancel}>
      <h2 className="text-lg font-bold text-slate-900">
        {isApprove ? "Approve Request" : "Decline Request"}
      </h2>
      <p className="text-sm text-slate-500 mt-2 mb-6">
        Are you sure you want to {isApprove ? "approve" : "decline"} this change request?
        The volunteer <span className="font-semibold text-slate-700">{volunteerName}</span> will be notified.
      </p>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
            isApprove ? "bg-blue-700 hover:bg-blue-800" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isApprove ? "Approve" : "Decline"}
        </button>
      </div>
    </ModalOverlay>
  );
}

// ---- Shared modal shell ----

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ---- Icons ----

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.586a1 1 0 0 1-.293.707l-6.414 6.414a1 1 0 0 0-.293.707V17l-4 4v-6.586a1 1 0 0 0-.293-.707L3.293 7.293A1 1 0 0 1 3 6.586V4Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditNoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 4h-8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function CalendarCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}