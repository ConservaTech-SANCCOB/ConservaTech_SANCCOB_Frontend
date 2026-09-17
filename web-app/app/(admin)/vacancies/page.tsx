"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { fetchVacancies, fetchShifts,createShift, Vacancy, Shift,ShiftPayload } from "../../lib/api/shifts";
import { ShiftFormModal } from "../../../components/shifts/ShiftFormModal";
const TIME_SLOT_LABELS: Record<string, string> = {
  "08:00-13:00": "AM",
  "14:00-17:00": "PM",
  "08:00-17:00": "Full Day",
};

export default function VacanciesPage() {
  const { token } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        // Both are needed: GET /api/vacancies only returns shifts that still
        // have open capacity — fully-staffed shifts are silently excluded.
        // To count "Filled" shifts, we compare against the full shift list.
        const [vacancyData, shiftData] = await Promise.all([
          fetchVacancies(token),
          fetchShifts(token),
        ]);
        setVacancies(vacancyData);
        setAllShifts(shiftData);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Unable to load vacancies.");
      } finally {
        setIsLoading(false);
      }
    }

    useEffect(() => {
      loadData();
    }, [token]);

    async function handleCreateShift(payload: ShiftPayload) {
      await createShift(token, payload);
      await loadData(); // refresh both vacancies and all shifts after creating a new shift
      setIsCreateModalOpen(false);
    }

  const stats = useMemo(() => {
    const openShiftsWithVacancies = vacancies.length;
    const openPositions = vacancies.reduce((sum, v) => sum + v.vacanciesAvailable, 0);
    // Shifts fully staffed = total shifts minus the ones that still show up
    // as having openings. This works because the vacancies endpoint already
    // excludes any shift with zero remaining capacity.
    const fullyFilled = Math.max(allShifts.length - openShiftsWithVacancies, 0);
    // "Urgent" = less than half staffed. Not an official threshold from the
    // business rules doc — a reasonable default until one is specified.
    const urgent = vacancies.filter(
      (v) => v.capacity > 0 && v.assignedVolunteers / v.capacity < 0.5
    ).length;

    return {
      totalVacancies: openShiftsWithVacancies,
      openPositions,
      fullyFilled,
      urgent,
    };
  }, [vacancies, allShifts]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vacancy Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Open shift vacancies, calculated live from shift capacity and assignments
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
        >
          + Create Shift
        </button>
      </div>

      {/* Honest explanation banner — vacancies aren't editable records
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Vacancies aren't separate records — they're calculated automatically from each shift's
        capacity and current assignments. To open a new vacancy, create or edit a shift in{" "}
        <Link href="/shifts" className="font-semibold underline">
          Shift Scheduling
        </Link>
        , and it'll appear here if it still has open spots.
      </div> */}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Shifts With Openings" value={stats.totalVacancies} />
        <StatCard label="Open Positions" value={stats.openPositions} color="text-blue-700" />
        <StatCard label="Fully Staffed" value={stats.fullyFilled} color="text-emerald-600" />
        <StatCard label="Urgent (<50% filled)" value={stats.urgent} color="text-red-600" />
      </div>

      {/* Vacancy cards — every entry here is, by definition, still open */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading vacancies…</div>
      ) : vacancies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-4xl mb-2">📋</p>
          <p className="font-semibold text-slate-800">No open vacancies right now</p>
          <p className="text-xs text-slate-400 mt-1">
            Every existing shift is fully staffed, or no shifts have been created yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {vacancies.map((v) => {
            const percent = v.capacity > 0 ? (v.assignedVolunteers / v.capacity) * 100 : 0;
            const isCritical = v.capacity > 0 && v.assignedVolunteers / v.capacity < 0.5;

            return (
              <div key={v.shiftId} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-slate-900">{v.location}</h3>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCritical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {isCritical ? "Critical" : "Understaffed"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {TIME_SLOT_LABELS[v.timeSlot] || v.timeSlot}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  <p>📅 {v.shiftDate}</p>
                  <p>🕐 {v.timeSlot}</p>
                  <p>🐦 {v.birdCount} birds</p>
                </div>

                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-500">
                    {v.assignedVolunteers} / {v.capacity} volunteers
                  </span>
                  <span className="font-semibold text-slate-800">
                    {v.vacanciesAvailable} remaining
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full ${isCritical ? "bg-red-500" : "bg-amber-500"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <Link
                  href="/shifts"
                  className="block text-center text-sm font-semibold text-blue-700 border border-blue-200 rounded-lg py-2 hover:bg-blue-50"
                >
                  View / Edit in Shift Scheduling
                </Link>
              </div>
            );
          })}
        </div>
      )}

       {isCreateModalOpen && (
        <ShiftFormModal
          mode="create"
          onCancel={() => setIsCreateModalOpen(false)}
          onSave={handleCreateShift}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color = "text-slate-900" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}