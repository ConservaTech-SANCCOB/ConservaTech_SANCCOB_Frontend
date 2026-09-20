"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { isUnauthorized } from "../../lib/api/https";
import {
  fetchVolunteers,
  fetchVolunteerById,
  fetchShiftRequests,
  approveShiftRequest,
  declineShiftRequest,
  createVolunteer,
  updateVolunteer,
  Volunteer,
  ShiftRequest,
  CreateVolunteerPayload,
  UpdateVolunteerPayload,
  AGE_BRACKETS,
} from "../../lib/api/volunteers";

// "2026-09-22" -> "Tue, 22 Sept 2026"
function formatShiftDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// NOTE: assumes the backend sends attendanceRate as a percentage (0-100).
// If a real response shows 0-1 instead, multiply by 100 here.
function toPercent(rate: number): number {
  return Math.max(0, Math.min(100, Math.round(rate)));
}

export default function VolunteersPage() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"management" | "requests" | "create">("management");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  const [viewingVolunteer, setViewingVolunteer] = useState<Volunteer | null>(null);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    type: "Approved" | "Declined";
    volunteerName: string;
  } | null>(null);

  // A 401 means the token is missing/expired: log out (the layout guard then
  // redirects to login). Anything else is shown to the admin.
  const reportError = (err: unknown, fallback: string) => {
    if (isUnauthorized(err)) {
      logout();
      return;
    }
    console.error(fallback, err);
    alert(err instanceof Error ? err.message : fallback);
  };

  const loadData = async (showSpinner = true) => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (showSpinner) setIsLoading(true);
    setLoadError("");

    const [vRes, rRes] = await Promise.allSettled([
      fetchVolunteers(token),
      fetchShiftRequests(token),
    ]);

    if (vRes.status === "fulfilled") setVolunteers(vRes.value);
    if (rRes.status === "fulfilled") setRequests(rRes.value);

    const failures: string[] = [];
    for (const [label, res] of [
      ["Volunteers", vRes],
      ["Change requests", rRes],
    ] as const) {
      if (res.status === "rejected") {
        if (isUnauthorized(res.reason)) {
          setIsLoading(false);
          logout();
          return;
        }
        console.error(`Failed to load ${label.toLowerCase()}`, res.reason);
        failures.push(
          `${label}: ${res.reason instanceof Error ? res.reason.message : "request failed"}`
        );
      }
    }

    if (failures.length > 0) setLoadError(failures.join(" · "));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  // The list endpoint doesn't include nationality / age / emergency contact,
  // so view & edit load the full detail record first.
  const openDetail = async (v: Volunteer, mode: "view" | "edit") => {
    setOpeningId(v.id);
    try {
      const detail = await fetchVolunteerById(token, v.id);
      if (mode === "view") setViewingVolunteer(detail);
      else setEditingVolunteer(detail);
    } catch (err) {
      reportError(err, "Unable to load volunteer details.");
    } finally {
      setOpeningId(null);
    }
  };

  const handleAction = async (id: string, newStatus: "Approved" | "Declined") => {
    try {
      if (newStatus === "Approved") {
        await approveShiftRequest(token, id);
      } else {
        await declineShiftRequest(token, id);
      }
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
      );
    } catch (err) {
      reportError(err, `Unable to ${newStatus.toLowerCase()} request. Please try again.`);
    }
  };

  const handleSaveEdit = async (id: string, payload: UpdateVolunteerPayload) => {
    try {
      await updateVolunteer(token, id, payload);
      setEditingVolunteer(null);
      await loadData(false);
    } catch (err) {
      reportError(err, "Failed to update volunteer.");
    }
  };

  // Throws on failure so the form can show the message.
  const handleCreate = async (payload: CreateVolunteerPayload) => {
    try {
      await createVolunteer(token, payload);
    } catch (err) {
      if (isUnauthorized(err)) logout();
      throw err;
    }
    // The create response has no userId, so re-fetch the real list.
    await loadData(false);
    setActiveTab("management");
  };

  const filteredVolunteers = volunteers.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase())
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
        {loadError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600"
          >
            <span>{loadError}</span>
            <button
              onClick={() => loadData()}
              className="shrink-0 px-3 py-1 rounded-lg bg-white border border-red-200 hover:bg-red-100 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">
            Loading volunteer data…
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
                {/* Filters (FE-A10) not built yet */}
                <button
                  disabled
                  title="Filters coming soon"
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200/80 bg-slate-50/80 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  <FilterIcon className="w-3.5 h-3.5" />
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
                    <th className="pb-3 px-4">Attendance Rate</th>
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
                      const attendance = toPercent(v.attendanceRate);
                      const isOpening = openingId === v.id;

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
                            <p className="text-slate-400 text-[11px]">{v.phone || "—"}</p>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-baseline gap-1">
                              <span className="font-bold text-slate-900">{v.weeklyHours}</span>
                              <span className="text-[10px] text-slate-400">hrs this week</span>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-900">{attendance}%</span>
                            <div className="w-28 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${attendance}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right space-x-1">
                            <button
                              onClick={() => openDetail(v, "view")}
                              disabled={isOpening}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
                              aria-label="View volunteer"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => openDetail(v, "edit")}
                              disabled={isOpening}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
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
              <h2 className="font-bold text-slate-900 text-sm">Pending Requests</h2>
              <p className="text-xs text-slate-400 mt-0.5">{pendingCount} pending approval</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="pb-3 px-4">Volunteer</th>
                    <th className="pb-3 px-4">Shift Date</th>
                    <th className="pb-3 px-4">Time</th>
                    <th className="pb-3 px-4">Reason</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No pending shift requests.
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
                        <td className="py-4 px-4 font-medium text-slate-700">
                          {formatShiftDate(r.shiftDate)}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-700">
                          {r.timeSlot || "—"}
                        </td>
                        <td
                          className="py-4 px-4 max-w-[240px] text-slate-500 font-medium"
                          title={r.reason}
                        >
                          <span className="line-clamp-2">{r.reason || "—"}</span>
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
                                  setConfirmAction({
                                    id: r.id,
                                    type: "Approved",
                                    volunteerName: r.volunteerName,
                                  })
                                }
                                className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all font-bold text-xs"
                                title="Approve"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    id: r.id,
                                    type: "Declined",
                                    volunteerName: r.volunteerName,
                                  })
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
          <CreateVolunteerForm
            onCreate={handleCreate}
            onCancel={() => setActiveTab("management")}
          />
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

// ---- Create Volunteer Form (Tab) ----

function CreateVolunteerForm({
  onCreate,
  onCancel,
}: {
  onCreate: (v: CreateVolunteerPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [ageBracket, setAgeBracket] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageBracket) return;

    setError("");
    setIsSubmitting(true);

    try {
      await onCreate({ firstName, lastName, email, phoneNumber, nationality, ageBracket });
    } catch (err) {
      console.error("Failed to create volunteer", err);
      setError(err instanceof Error ? err.message : "Unable to create volunteer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-bold text-slate-900 text-sm">Create Volunteer Profile</h2>
        <p className="text-xs text-slate-400 mt-0.5">Add a new volunteer to the system</p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" value={firstName} onChange={setFirstName} required />
        <FormField label="Last Name" value={lastName} onChange={setLastName} required />
        <FormField label="Email" value={email} onChange={setEmail} type="email" required />
        <FormField label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} required />
        <FormField label="Nationality" value={nationality} onChange={setNationality} required />
        <AgeBracketSelect value={ageBracket} onChange={setAgeBracket} required />
      </div>

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

function AgeBracketSelect({
  value,
  onChange,
  required = false,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  // If the backend holds a value that isn't in our list, keep it selectable.
  const known = (AGE_BRACKETS as readonly string[]).includes(value);

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age Bracket</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
      >
        <option value="" disabled={required}>
          {required ? "Select age bracket" : "Not specified"}
        </option>
        {!known && value && <option value={value}>{value}</option>}
        {AGE_BRACKETS.map((bracket) => (
          <option key={bracket} value={bracket}>
            {bracket}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---- View Modal ----

function ViewVolunteerModal({
  volunteer,
  onClose,
}: {
  volunteer: Volunteer;
  onClose: () => void;
}) {
  const attendance = toPercent(volunteer.attendanceRate);
  const details = [volunteer.nationality, volunteer.ageBracket].filter(Boolean).join(" · ");

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-900">Volunteer Profile</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
          <CloseIcon />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-xl bg-blue-700 text-white font-bold flex items-center justify-center text-lg shrink-0">
          {volunteer.initials}
        </div>
        <div>
          <p className="font-bold text-slate-900">{volunteer.name}</p>
          <p className="text-sm text-slate-500">{details || "No details provided"}</p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <ContactRow icon={<MailIcon />} label="Email" value={volunteer.email || "—"} />
        <ContactRow icon={<PhoneIcon />} label="Phone" value={volunteer.phone || "—"} />
        <ContactRow
          icon={<PhoneIcon />}
          label="Emergency contact"
          value={
            [volunteer.emergencyContactName, volunteer.emergencyContactPhone]
              .filter(Boolean)
              .join(" · ") || "—"
          }
        />
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">Hours this week</span>
          <span className="text-sm font-bold text-slate-900">{volunteer.weeklyHours} hrs</span>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-600">Attendance rate</span>
            <span className="text-sm font-bold text-slate-900">{attendance}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${attendance}%` }} />
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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
  onSave: (id: string, payload: UpdateVolunteerPayload) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(volunteer.firstName);
  const [lastName, setLastName] = useState(volunteer.lastName);
  const [email, setEmail] = useState(volunteer.email);
  const [phoneNumber, setPhoneNumber] = useState(volunteer.phone);
  const [nationality, setNationality] = useState(volunteer.nationality);
  const [ageBracket, setAgeBracket] = useState(volunteer.ageBracket);
  const [emergencyContactName, setEmergencyContactName] = useState(volunteer.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(volunteer.emergencyContactPhone);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(volunteer.id, {
      firstName,
      lastName,
      email,
      phoneNumber,
      nationality,
      ageBracket,
      emergencyContactName,
      emergencyContactPhone,
    });
    setIsSaving(false);
  };

  return (
    <ModalOverlay onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Edit Volunteer</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <FormField label="First Name" value={firstName} onChange={setFirstName} required />
          <FormField label="Last Name" value={lastName} onChange={setLastName} required />
          <FormField label="Email" value={email} onChange={setEmail} type="email" required />
          <FormField label="Phone" value={phoneNumber} onChange={setPhoneNumber} />
          <FormField label="Nationality" value={nationality} onChange={setNationality} />
          <AgeBracketSelect value={ageBracket} onChange={setAgeBracket} />
          <FormField
            label="Emergency Contact Name"
            value={emergencyContactName}
            onChange={setEmergencyContactName}
          />
          <FormField
            label="Emergency Contact Phone"
            value={emergencyContactPhone}
            onChange={setEmergencyContactPhone}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            <CheckIcon />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
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
        Are you sure you want to {isApprove ? "approve" : "decline"} the change request from{" "}
        <span className="font-semibold text-slate-700">{volunteerName}</span>?
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

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
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