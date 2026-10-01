"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  fetchVolunteers,
  fetchShiftRequests,
  Volunteer,
  ShiftRequest,
} from "../../lib/api/volunteers";

export default function VolunteersPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"management" | "requests">("management");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
        console.error("Failed to load volunteer data", err);
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

  const filteredVolunteers = volunteers.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.area.toLowerCase().includes(searchQuery.toLowerCase())
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
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">
            Loading volunteer data…
          </div>
        ) : activeTab === "management" ? (
          /* TAB 1: VOLUNTEER MANAGEMENT */
          <>
            {/* Search and Action Bar */}
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
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                </div>
                <button className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition-colors">
                  <svg
                    className="w-3.5 h-3.5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.586a1 1 0 0 1-.293.707l-6.414 6.414a1 1 0 0 0-.293.707V17l-4 4v-6.586a1 1 0 0 0-.293-.707L3.293 7.293A1 1 0 0 1 3 6.586V4Z"
                    />
                  </svg>
                  Filter
                </button>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {filteredVolunteers.length} volunteers
              </span>
            </div>

            {/* Volunteers Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="pb-3 px-4">Profile</th>
                    <th className="pb-3 px-4">Volunteer Name </th>
                    <th className="pb-3 px-4">Contact Information </th>
                    <th className="pb-3 px-4">Weekly Hours</th>
                    <th className="pb-3 px-4">Availability</th>
                    <th className="pb-3 px-4">Max Hours </th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredVolunteers.map((v) => {
                    //Weekly Rule Logic: Weekly hrs worked cap displayed (40hrs max)
                      const weeklyHours = Math.min(v.hoursCompleted, 40);
                      const progressPercentage = (weeklyHours / 40) * 100;
                    return (
                      <tr
                      key={v.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="w-9 h-9 rounded-full bg-[#0B2447] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {v.initials}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                          {v.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-normal">
                          {v.area}
                        </p>
                      </td>
                      <td className="py-4 px-4 space-y-1">
                        <p className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <span className="text-slate-400"></span> {v.email}
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <span></span> {v.phone}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-baseline gap-1">
                        <span className="font-bold text-slate-900 underline underline-offset-4 decoration-2 decoration-blue-600">
                          {weeklyHours} hrs
                        </span>
                        <span className="text-[10px] text-slate-400">/week</span>
                        </div>
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${progressPercentage}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {v.availability.map((day) => (
                            <span
                              key={day}
                              className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-700">
                        {v.maxHours}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                          👁
                        </button>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                          ✏️
                        </button>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* TAB 2: SHIFT CHANGE REQUESTS */
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Pending & Recent Requests
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {pendingCount} pending approval
              </p>
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
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
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
                        {r.currentDate}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-700">
                        {r.currentTime}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-700">
                        {r.requestedDate}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-700">
                        {r.requestedTime}
                      </td>
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
                              onClick={() => handleAction(r.id, "Approved")}
                              className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all font-bold text-xs"
                              title="Approve"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleAction(r.id, "Declined")}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }

