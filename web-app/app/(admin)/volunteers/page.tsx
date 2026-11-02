"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { isUnauthorized } from "../../lib/api/http";
import {
  fetchVolunteers,
  fetchVolunteerById,
  fetchShiftRequests,
  approveShiftRequest,
  declineShiftRequest,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  Volunteer,
  ShiftRequest,
  CreateVolunteerPayload,
  UpdateVolunteerPayload,
  AGE_BRACKETS,
} from "../../lib/api/volunteers";
import AttendanceModal from "../../../components/volunteers/AttendanceModal";

//---------------------------------------------------------------------------------------------------------------//
// Helper Functions
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Formats an ISO-style date string for display in the shift requests table.
// Example: "2026-09-22" -> "Tue, 22 Sept 2026". Returns "—" for empty values
// and the original value if it cannot be parsed as a date.
//</summary>
//-----------------------------------------------------------------------------------------------//
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

//-----------------------------------------------------------------------------------------------//
//<summary>
// Converts the backend attendance rate into a whole number clamped to 0-100.
// NOTE: assumes the backend sends attendanceRate as a percentage (0-100).
// If a real response shows 0-1 instead, multiply by 100 here.
//</summary>
//-----------------------------------------------------------------------------------------------//
function toPercent(rate: number): number {
  return Math.max(0, Math.min(100, Math.round(rate)));
}

//---------------------------------------------------------------------------------------------------------------//
// Main Page Component
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Admin Volunteers page. Hosts three tabs: Volunteer Management (list, search,
// view, edit, attendance), Request Change (approve/decline shift change requests)
// and Create Volunteer. Owns all data loading and the modal state for the page.
//</summary>
//-----------------------------------------------------------------------------------------------//
export default function VolunteersPage() {
  //-----------------------------------------------------------------------------------------------//
  // Auth & State
  //-----------------------------------------------------------------------------------------------//
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"management" | "requests" | "create">("management");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  //-----------------------------------------------------------------------------------------------//
  // Modal State
  //-----------------------------------------------------------------------------------------------//
  const [viewingVolunteer, setViewingVolunteer] = useState<Volunteer | null>(null);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [attendanceVolunteer, setAttendanceVolunteer] = useState<Volunteer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Volunteer | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    type: "Approved" | "Declined";
    volunteerName: string;
  } | null>(null);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Central error handler for page actions. A 401 means the token is
  // missing/expired: log out (the layout guard then redirects to login).
  // Anything else is shown to the admin.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const reportError = (err: unknown, fallback: string) => {
    if (isUnauthorized(err)) {
      logout();
      return;
    }
    console.error(fallback, err);
    alert(err instanceof Error ? err.message : fallback);
  };

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Loads volunteers and shift requests in parallel. Partial failures are
  // collected into a single loadError message; a 401 triggers logout.
  // Pass showSpinner = false to refresh silently in the background.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
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

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Initial data load. Re-runs whenever the auth token changes.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  useEffect(() => {
    loadData();
  }, [token]);

  //-----------------------------------------------------------------------------------------------//
  // Derived Values
  //-----------------------------------------------------------------------------------------------//
  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Opens the view or edit modal for a volunteer. The list endpoint doesn't
  // include nationality / age / emergency contact, so the full detail record
  // is loaded first.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
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

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Approves or declines a shift change request, then updates the request's
  // status in local state.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
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

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Saves edits to a volunteer, closes the edit modal and silently
  // re-fetches the list.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const handleSaveEdit = async (id: string, payload: UpdateVolunteerPayload) => {
    try {
      await updateVolunteer(token, id, payload);
      setEditingVolunteer(null);
      await loadData(false);
    } catch (err) {
      reportError(err, "Failed to update volunteer.");
    }
  };

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Deletes a volunteer. Throws on failure so the confirm modal can show the
  // backend's message. On success the modal closes and the list is re-fetched,
  // so the screen shows what the backend really did.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const handleDelete = async (id: string) => {
    try {
      await deleteVolunteer(token, id);
    } catch (err) {
      if (isUnauthorized(err)) logout();
      throw err;
    }
    setDeleteTarget(null);
    await loadData(false);
  };
  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Creates a new volunteer. Throws on failure so the form can show the message.
  // On success the list is re-fetched (the create response has no userId) and
  // the page switches back to the management tab.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
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

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Attendance updates change backend-computed Weekly Hours / Attendance Rate,
  // so re-fetch the volunteer list (no spinner — the modal stays open on top).
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const handleAttendanceChanged = () => {
    loadData(false);
  };

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Volunteers matching the search box (case-insensitive on name or email).
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const filteredVolunteers = volunteers.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  //---------------------------------------------------------------------------------------------------------------//
  // Render
  //---------------------------------------------------------------------------------------------------------------//
  return (
    <div className="space-y-6">
      {/*------------------------------------ Page Heading ----------------------------------------------------*/}
      <div>
        <h1 className="text-2xl font-black text-ink-strong tracking-tight">Volunteers</h1>
        <p className="text-base text-ink-muted mt-0.5">
          Manage volunteer profiles and shift change requests
        </p>
      </div>

      {/*------------------------------------ Main Pill Tabs ----------------------------------------------------*/}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("management")}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "management"
              ? "bg-surface text-ink-strong shadow-sm border border-line"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Volunteer Management
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "requests"
              ? "bg-surface text-ink-strong shadow-sm border border-line"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Request Change
          {pendingCount > 0 && (
            <span className="bg-warn text-warn-ink text-[11px] font-bold px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "create"
              ? "bg-surface text-ink-strong shadow-sm border border-line"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Create Volunteer
        </button>
      </div>

      {/*------------------------------------ Main Container Card ----------------------------------------------------*/}
      <div className="bg-surface rounded-3xl border border-line shadow-sm p-6 space-y-5">
        {/*------------------------------------ Load Error Banner ----------------------------------------------------*/}
        {loadError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 p-3 rounded-xl bg-urgent border border-urgent-line text-sm font-bold text-urgent-ink"
          >
            <span>{loadError}</span>
            <button
              onClick={() => loadData()}
              className="shrink-0 px-3 py-1 rounded-lg bg-surface border border-urgent-line hover:brightness-95 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          /*------------------------------------ Loading State ----------------------------------------------------*/
          <div className="py-16 text-center text-ink-faint text-base font-bold">
            Loading volunteer data…
          </div>
        ) : activeTab === "management" ? (
          /*------------------------------------ TAB 1: VOLUNTEER MANAGEMENT ----------------------------------------------------*/
          <>
            {/*------------------------------------ Search & Filter Bar ----------------------------------------------------*/}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search volunteers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-muted border-2 border-line-strong rounded-2xl pl-9 pr-4 py-2.5 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-4 focus:ring-focus/20 focus:border-focus transition-all"
                  />
                  <SearchIcon className="w-4 h-4 text-ink-faint absolute left-3 top-2.5" />
                </div>
             
                <button
                  disabled
                  title="Filters coming soon"
                  className="flex items-center gap-1.5 px-3.5 py-2 border-2 border-line bg-surface-muted rounded-xl text-sm font-bold text-ink-faint cursor-not-allowed"
                >
                  <FilterIcon className="w-3.5 h-3.5" />
                  Filter
                </button>
              </div>
              <span className="text-sm font-bold text-ink-faint">
                {filteredVolunteers.length} volunteers
              </span>
            </div>
 
 {/*------------------------------------ Volunteers Table ----------------------------------------------------*/}
     <div className="overflow-x-auto">
       <table className="w-full text-left text-sm text-ink-muted">
         <thead className="text-ink-faint font-black uppercase tracking-wider text-xs border-b border-line-soft">
          <tr>
          <th className="pb-3 px-4">Profile</th>
            <th className="pb-3 px-4">Volunteer Name</th>
            <th className="pb-3 px-4">Contact Information</th>
              <th className="pb-3 px-4">Weekly Hours</th>
            <th className="pb-3 px-4">Attendance Rate</th>
            <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {filteredVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-ink-faint font-bold">
                        No volunteers found.
                      </td>
                    </tr>
                  ) : (
                    filteredVolunteers.map((v) => {
                      const attendance = toPercent(v.attendanceRate);
                      const isOpening = openingId === v.id;

                      return (
                        <tr key={v.id} className="hover:bg-tint transition-colors group">
{/*------------------------------------ Profile Avatar -------------------------------------------------------------------------------*/}
                          <td className="py-4 px-4">
                            <div className="w-9 h-9 rounded-full bg-brand text-brand-ink font-black flex items-center justify-center text-xs shadow-sm">
                              {v.initials}
                            </div>
                          </td>

 {/*------------------------------------ Volunteer Name ------------------------------------------------------------------------------------*/}
                          <td className="py-4 px-4">
                            <p className="font-extrabold text-ink text-base group-hover:text-brand transition-colors">
                              {v.name}
                            </p>
                          </td>

 {/*------------------------------------ Contact Information ------------------------------------------------------------------------------------*/}
                          <td className="py-4 px-4 space-y-1">
                            <p className="text-ink-muted text-[13px]">{v.email}</p>
                            <p className="text-ink-faint text-[13px]">{v.phone || "—"}</p>
                          </td>
 {/*------------------------------------ Weekly Hours ----------------------------------------------------*/}
                          <td className="py-4 px-4">
                            <div className="flex items-baseline gap-1">
                              <span className="font-black text-ink-strong">{v.weeklyHours}</span>
                              <span className="text-xs text-ink-faint">hrs this week</span>
                            </div>
                          </td>
  {/*------------------------------------ Attendance Rate ----------------------------------------------------*/}
                          <td className="py-4 px-4">
                            <button
                              onClick={() => setAttendanceVolunteer(v)}
                              className="group/att flex items-center gap-2 text-left"
                              title="Manage attendance"
                            >
                              <div>
                                <span className="font-black text-ink-strong group-hover/att:text-brand transition-colors">
                                  {attendance}%
                                </span>
                                <div className="w-28 h-1.5 bg-surface-sunken rounded-full mt-2 overflow-hidden">
                                  <div
                                    className="h-full bg-brand rounded-full"
                                    style={{ width: `${attendance}%` }}
                                  />
                                </div>
                              </div>
                              <CalendarCheckIcon className="w-3.5 h-3.5 text-ink-faint group-hover/att:text-brand transition-colors shrink-0" />
                            </button>
                          </td>

                          {/*------------------------------------ Row Actions ----------------------------------------------------*/}
                          <td className="py-4 px-4 text-right space-x-1">
                            <button
                              onClick={() => openDetail(v, "view")}
                              disabled={isOpening}
                              className="p-1.5 rounded-lg text-ink-faint hover:text-brand hover:bg-tint transition-all disabled:opacity-50"
                              aria-label="View volunteer"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => openDetail(v, "edit")}
                              disabled={isOpening}
                              className="p-1.5 rounded-lg text-ink-faint hover:text-brand hover:bg-tint transition-all disabled:opacity-50"
                              aria-label="Edit volunteer"
                            >
                              <EditNoteIcon />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(v)}
                              disabled={isOpening}
                              className="p-1.5 rounded-lg text-ink-faint hover:text-urgent-ink hover:bg-urgent transition-all disabled:opacity-50"
                              aria-label="Delete volunteer"
                              title="Delete volunteer"
                            >
                              <TrashIcon />
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
          /*------------------------------------ TAB 2: SHIFT CHANGE REQUESTS ----------------------------------------------------*/
          <div className="space-y-4">
            {/*------------------------------------ Requests Heading ----------------------------------------------------*/}
            <div>
              <h2 className="font-black text-ink-strong text-base">Pending Requests</h2>
              <p className="text-sm text-ink-faint mt-0.5">{pendingCount} pending approval</p>
            </div>

            {/*------------------------------------ Requests Table ----------------------------------------------------*/}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink-muted">
                <thead className="text-ink-faint font-black uppercase tracking-wider text-xs border-b border-line-soft">
                  <tr>
                    <th className="pb-3 px-4">Volunteer</th>
                    <th className="pb-3 px-4">Shift Date</th>
                    <th className="pb-3 px-4">Time</th>
                    <th className="pb-3 px-4">Reason</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-ink-faint font-bold">
                        No pending shift requests.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id} className="hover:bg-tint transition-colors">
 {/*------------------------------------ Requesting Volunteer ----------------------------------------------------*/}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand text-brand-ink font-black flex items-center justify-center text-xs shrink-0">
                              {r.volunteerInitials}
                            </div>
                            <span className="font-extrabold text-ink text-sm">
                              {r.volunteerName}
                            </span>
                          </div>
                        </td>

 {/*------------------------------------ Shift Date & Time ----------------------------------------------------*/}
                        <td className="py-4 px-4 font-bold text-ink">
                          {formatShiftDate(r.shiftDate)}
                        </td>
                        <td className="py-4 px-4 font-bold text-ink">
                          {r.timeSlot || "—"}
                        </td>

{/*------------------------------------ Reason ----------------------------------------------------*/}
                        <td
                          className="py-4 px-4 max-w-[240px] text-ink-muted font-bold"
                          title={r.reason}
                        >
                          <span className="line-clamp-2">{r.reason || "—"}</span>
                        </td>
 {/*------------------------------------ Status Badge ----------------------------------------------------*/}
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full font-semibold text-[10px] inline-block ${
                              r.status === "Approved"
                                ? "bg-ok text-ok-ink border border-ok"
                                : r.status === "Declined"
                                ? "bg-urgent text-urgent-ink border border-urgent-line"
                                : "bg-warn text-warn-ink border border-warn-line"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>

{/*------------------------------------ Approve / Decline Actions ----------------------------------------------------*/}
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
                                className="w-8 h-8 rounded-full bg-ok text-ok-ink border border-ok hover:bg-ok-bar hover:text-white flex items-center justify-center transition-all font-black text-xs"
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
                                className="w-8 h-8 rounded-full bg-urgent text-urgent-ink border border-urgent-line hover:bg-urgent-ink hover:text-white flex items-center justify-center transition-all font-black text-xs"
                                title="Decline"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span className="text-ink-faint font-black">-</span>
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
          /*------------------------------------ TAB 3: CREATE VOLUNTEER ----------------------------------------------------*/
          <CreateVolunteerForm
            onCreate={handleCreate}
            onCancel={() => setActiveTab("management")}
          />
        )}
      </div>

      {/*------------------------------------ View Modal ----------------------------------------------------*/}
      {viewingVolunteer && (
        <ViewVolunteerModal
          volunteer={viewingVolunteer}
          onClose={() => setViewingVolunteer(null)}
        />
      )}

      {/*------------------------------------ Edit Modal ----------------------------------------------------*/}
      {editingVolunteer && (
        <EditVolunteerModal
          volunteer={editingVolunteer}
          onCancel={() => setEditingVolunteer(null)}
          onSave={handleSaveEdit}
        />
      )}

{/*------------------------------------ Attendance Modal ----------------------------------------------------*/}
      {attendanceVolunteer && (
        <AttendanceModal
          volunteer={attendanceVolunteer}
          onClose={() => setAttendanceVolunteer(null)}
          onAttendanceChanged={handleAttendanceChanged}
        />
      )}

{/*------------------------------------ Delete Volunteer Modal ----------------------------------------------------*/}
      {deleteTarget && (
        <DeleteVolunteerModal
          volunteer={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}
 {/*------------------------------------ Confirm Approve / Decline Modal ----------------------------------------------------*/}
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

//---------------------------------------------------------------------------------------------------------------//
// Create Volunteer Form (Tab)
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Form shown on the "Create Volunteer" tab. Collects the new volunteer's details,
// calls onCreate on submit and displays any error returned by the parent handler.
//</summary>
//-----------------------------------------------------------------------------------------------//
function CreateVolunteerForm({
  onCreate,
  onCancel,
}: {
  onCreate: (v: CreateVolunteerPayload) => Promise<void>;
  onCancel: () => void;
}) {
  //-----------------------------------------------------------------------------------------------//
  // Form State
  //-----------------------------------------------------------------------------------------------//
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [ageBracket, setAgeBracket] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Validates the age bracket, submits the form via onCreate and surfaces
  // any failure message in the form.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
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

  //-----------------------------------------------------------------------------------------------//
  // Render
  //-----------------------------------------------------------------------------------------------//
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {/*------------------------------------ Form Heading ----------------------------------------------------*/}
      <div>
        <h2 className="font-black text-ink-strong text-base">Create Volunteer Profile</h2>
        <p className="text-sm text-ink-faint mt-0.5">Add a new volunteer to the system</p>
      </div>

      {/*------------------------------------ Error Banner ----------------------------------------------------*/}
      {error && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-urgent border border-urgent-line text-sm font-bold text-urgent-ink"
        >
          {error}
        </div>
      )}

      {/*------------------------------------ Form Fields ----------------------------------------------------*/}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" value={firstName} onChange={setFirstName} required />
        <FormField label="Last Name" value={lastName} onChange={setLastName} required />
        <FormField label="Email" value={email} onChange={setEmail} type="email" required />
        <FormField label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} required />
        <FormField label="Nationality" value={nationality} onChange={setNationality} required />
        <AgeBracketSelect value={ageBracket} onChange={setAgeBracket} required />
      </div>

      {/*------------------------------------ Form Actions ----------------------------------------------------*/}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-full text-sm font-extrabold text-ink-muted hover:bg-tint transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-full text-sm font-extrabold bg-brand text-brand-ink hover:bg-brand-hover transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Volunteer"}
        </button>
      </div>
    </form>
  );
}

//---------------------------------------------------------------------------------------------------------------//
// Shared Form Inputs
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Reusable labelled text input used by both the create form and the edit modal.
//</summary>
//-----------------------------------------------------------------------------------------------//
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
      {/*------------------------------------ Field Label ----------------------------------------------------*/}
      <label className="block text-sm font-extrabold text-ink mb-1.5">{label}</label>

      {/*------------------------------------ Field Input ----------------------------------------------------*/}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-line-strong rounded-2xl px-4 py-2.5 text-base text-ink bg-surface focus:outline-none focus:ring-4 focus:ring-focus/20 focus:border-focus"
      />
    </div>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Dropdown for choosing a volunteer's age bracket from AGE_BRACKETS. If the
// backend holds a value that isn't in the list, it is kept selectable.
//</summary>
//-----------------------------------------------------------------------------------------------//
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
      {/*------------------------------------ Select Label ----------------------------------------------------*/}
      <label className="block text-sm font-extrabold text-ink mb-1.5">Age Bracket</label>

      {/*------------------------------------ Select Options ----------------------------------------------------*/}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border-2 border-line-strong rounded-2xl px-4 py-2.5 text-base text-ink bg-surface focus:outline-none focus:ring-4 focus:ring-focus/20 focus:border-focus cursor-pointer"
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

//----------------------------------------------VIEW MODAL-----------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Read-only modal showing a volunteer's profile: avatar, nationality / age
// bracket, contact details, emergency contact, weekly hours and attendance rate.
//</summary>
//-----------------------------------------------------------------------------------------------//
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
      {/*------------------------------------ Modal Header ----------------------------------------------------*/}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-ink-strong">Volunteer Profile</h2>
        <button onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Close">
          <CloseIcon />
        </button>
      </div>

      {/*------------------------------------ Profile Summary ----------------------------------------------------*/}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-brand text-brand-ink font-black flex items-center justify-center text-lg shrink-0">
          {volunteer.initials}
        </div>
        <div>
          <p className="font-black text-ink-strong">{volunteer.name}</p>
          <p className="text-sm text-ink-muted">{details || "No details provided"}</p>
        </div>
      </div>

      {/*------------------------------------ Contact Details ----------------------------------------------------*/}
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

      {/*------------------------------------ Hours & Attendance Stats ----------------------------------------------------*/}
      <div className="bg-surface-muted rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-ink-muted">Hours this week</span>
          <span className="text-sm font-black text-ink-strong">{volunteer.weeklyHours} hrs</span>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-ink-muted">Attendance rate</span>
            <span className="text-sm font-black text-ink-strong">{attendance}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-sunken rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full" style={{ width: `${attendance}%` }} />
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// A single icon + label + value row used in the volunteer profile modal.
//</summary>
//-----------------------------------------------------------------------------------------------//
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
      {/*------------------------------------ Row Icon ----------------------------------------------------*/}
      <div className="w-9 h-9 rounded-xl bg-tint text-brand flex items-center justify-center shrink-0">
        {icon}
      </div>

      {/*------------------------------------ Row Text ----------------------------------------------------*/}
      <div>
        <p className="text-sm text-ink-faint">{label}</p>
        <p className="text-base text-ink font-bold">{value}</p>
      </div>
    </div>
  );
}

//-------------------------------------------EDIT MODAL--------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Modal form for editing an existing volunteer's details, including
// nationality, age bracket and emergency contact. Calls onSave with the
// updated payload.
//</summary>
//-----------------------------------------------------------------------------------------------//
function EditVolunteerModal({
  volunteer,
  onCancel,
  onSave,
}: {
  volunteer: Volunteer;
  onCancel: () => void;
  onSave: (id: string, payload: UpdateVolunteerPayload) => Promise<void>;
}) {
  //-----------------------------------------------------------------------------------------------//
  // Form State (pre-filled from the volunteer record)
  //-----------------------------------------------------------------------------------------------//
  const [firstName, setFirstName] = useState(volunteer.firstName);
  const [lastName, setLastName] = useState(volunteer.lastName);
  const [email, setEmail] = useState(volunteer.email);
  const [phoneNumber, setPhoneNumber] = useState(volunteer.phone);
  const [nationality, setNationality] = useState(volunteer.nationality);
  const [ageBracket, setAgeBracket] = useState(volunteer.ageBracket);
  const [emergencyContactName, setEmergencyContactName] = useState(volunteer.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(volunteer.emergencyContactPhone);
  const [isSaving, setIsSaving] = useState(false);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Submits the edited fields through onSave while showing the saving state.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
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

  //-----------------------------------------------------------------------------------------------//
  // Render
  //-----------------------------------------------------------------------------------------------//
  return (
    <ModalOverlay onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        {/*------------------------------------ Modal Header ----------------------------------------------------*/}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-ink-strong">Edit Volunteer</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-ink-faint hover:text-ink"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/*------------------------------------ Form Fields ----------------------------------------------------*/}
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

        {/*------------------------------------ Form Actions ----------------------------------------------------*/}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm font-extrabold text-ink-muted hover:bg-tint transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-extrabold bg-brand text-brand-ink hover:bg-brand-hover transition-colors disabled:opacity-60"
          >
            <CheckIcon />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

//---------------------------------------------------------------------------------------------------------------//
// Confirm Action Modal
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Confirmation dialog shown before approving or declining a shift change request.
//</summary>
//-----------------------------------------------------------------------------------------------//
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
      {/*------------------------------------ Modal Title & Message ----------------------------------------------------*/}
      <h2 className="text-xl font-black text-ink-strong">
        {isApprove ? "Approve Request" : "Decline Request"}
      </h2>
      <p className="text-base text-ink-muted mt-2 mb-6">
        Are you sure you want to {isApprove ? "approve" : "decline"} the change request from{" "}
        <span className="font-extrabold text-ink">{volunteerName}</span>?
      </p>

      {/*------------------------------------ Modal Actions ----------------------------------------------------*/}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-full text-sm font-extrabold text-ink-muted hover:bg-tint transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-5 py-2.5 rounded-full text-sm font-extrabold text-white transition-colors ${
            isApprove ? "bg-brand hover:bg-brand-hover" : "bg-urgent-ink hover:brightness-110"
          }`}
        >
          {isApprove ? "Approve" : "Decline"}
        </button>
      </div>
    </ModalOverlay>
  );
}

//---------------------------------------------------------------------------------------------------------------//
// Delete Volunteer Modal
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Confirmation dialog shown before deleting a volunteer. Shows the backend's
// error message if the delete is refused.
//</summary>
//-----------------------------------------------------------------------------------------------//
function DeleteVolunteerModal({
  volunteer,
  onCancel,
  onConfirm,
}: {
  volunteer: Volunteer;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setError("");
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error("Failed to delete volunteer", err);
      setError(err instanceof Error ? err.message : "Unable to delete volunteer.");
      setIsDeleting(false);
    }
  };

  return (
    <ModalOverlay onClose={() => !isDeleting && onCancel()}>
      <h2 className="text-xl font-black text-ink-strong">Delete volunteer?</h2>
      <p className="text-base text-ink-muted mt-2 mb-4">
        Are you sure you want to delete{" "}
        <span className="font-extrabold text-ink">{volunteer.name}</span>?{" "}
        <span className="font-extrabold text-ink-muted">This can&apos;t be undone.</span>
      </p>

      {error && (
        <p
          role="alert"
          className="text-sm text-urgent-ink bg-urgent border border-urgent-line rounded-xl px-3 py-2 mb-4"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="px-5 py-2.5 rounded-full text-sm font-extrabold text-ink-muted hover:bg-tint transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isDeleting}
          className="px-5 py-2.5 rounded-full text-sm font-extrabold bg-urgent-ink text-white hover:brightness-110 transition-colors disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </ModalOverlay>
  );
}

//---------------------------------------------------------------------------------------------------------------//
// Shared Modal Shell
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Shared modal wrapper: a dimmed full-screen backdrop that closes on click,
// with a centred card that stops click propagation.
//</summary>
//-----------------------------------------------------------------------------------------------//
function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-[#0E2A3D]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/*------------------------------------ Modal Card ----------------------------------------------------*/}
      <div
        className="bg-surface border-[1.5px] border-line rounded-3xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

//---------------------------------------------ICONS------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Magnifying-glass icon used in the search input.
//</summary>
//-----------------------------------------------------------------------------------------------//
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Funnel icon used on the (disabled) Filter button.
//</summary>
//-----------------------------------------------------------------------------------------------//
function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.586a1 1 0 0 1-.293.707l-6.414 6.414a1 1 0 0 0-.293.707V17l-4 4v-6.586a1 1 0 0 0-.293-.707L3.293 7.293A1 1 0 0 1 3 6.586V4Z" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Eye icon used for the "View volunteer" row action.
//</summary>
//-----------------------------------------------------------------------------------------------//
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Pen-and-note icon used for the "Edit volunteer" row action.
//</summary>
//-----------------------------------------------------------------------------------------------//
function EditNoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 4h-8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Calendar-with-tick icon shown next to the attendance rate.
//</summary>
//-----------------------------------------------------------------------------------------------//
function CalendarCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// "X" icon used for closing modals.
//</summary>
//-----------------------------------------------------------------------------------------------//
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Bin icon used for the "Delete volunteer" row action.
//</summary>
//-----------------------------------------------------------------------------------------------//
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
//-----------------------------------------------------------------------------------------------//
//<summary>
// Tick icon used on the "Save Changes" button.
//</summary>
//-----------------------------------------------------------------------------------------------//
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Envelope icon used for the email row in the profile modal.
//</summary>
//-----------------------------------------------------------------------------------------------//
function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Phone handset icon used for the phone and emergency contact rows.
//</summary>
//-----------------------------------------------------------------------------------------------//
function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//