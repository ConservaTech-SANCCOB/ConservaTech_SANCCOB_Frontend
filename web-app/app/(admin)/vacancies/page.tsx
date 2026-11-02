"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { fetchVacancies, fetchShifts, createShift, Vacancy, Shift, ShiftPayload } from "../../lib/api/shifts";
import { ShiftFormModal } from "../../../components/shifts/ShiftFormModal";
import VacanciesList from "../../../components/VacanciesList";

//-----------------------------------------------------------------------------------------------//
//<summary>
// Main page component for viewing, filtering, and creating vacancies.
//</summary>

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
    <div className="p-8 space-y-6">
      {/*------------------------------------ Header Section ------------------------------------*/}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-4xl font-black text-brand">Vacancies</h1>
          <p className="text-lg text-ink-muted">
            Open spots, worked out live from each shift&apos;s capacity and who is assigned.
          </p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className={buttonPrimary}>
          <LineIcon d={ICONS.plus} size={18} />
          Create a shift
        </button>
      </div>

      {/*------------------------------------ Error Alert ------------------------------------*/}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-urgent border border-urgent-line text-sm font-bold text-urgent-ink">
          {errorMessage}
        </div>
      )}

      {/*------------------------------------ Stat Cards Grid ------------------------------------*/}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Shifts with openings" value={stats.totalVacancies} tone="muted" />
        <StatCard label="Open positions" value={stats.openPositions} tone="brand" />
        <StatCard label="Fully staffed" value={stats.fullyFilled} tone="ok" />
        <StatCard label="Urgent (<50% filled)" value={stats.urgent} tone="urgent" />
      </div>

      {/*------------------------------------ Vacancies Content Section ------------------------------------*/}
      {isLoading ? (
        <p className="py-16 text-center text-ink-faint font-semibold">Loading vacancies…</p>
      ) : vacancies.length === 0 ? (
        <div className={`${card} p-10 text-center flex flex-col items-center gap-2`}>
          <LineIcon d={ICONS.calendarCheck} size={40} className="text-ink-faint" />
          <p className="font-extrabold text-ink-strong">No open vacancies right now</p>
          <p className="text-sm text-ink-faint">
            Every existing shift is fully staffed, or no shifts have been created yet.
          </p>
        </div>
      ) : (
        <VacanciesList vacancies={vacancies} onRefresh={loadData} />
      )}

      {/*------------------------------------ Create Shift Modal ------------------------------------*/}
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

//-----------------------------------------------------------------------------------------------//
//<summary>
// Reusable stat card UI component for key summary metrics.
//</summary>

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "brand" | "ok" | "urgent";
}) {
  const valueColor =
    tone === "ok" ? "text-ok-ink" : tone === "brand" ? "text-brand" : tone === "urgent" ? "text-urgent-ink" : "text-ink-strong";
  const cardTone = tone === "urgent" ? "bg-urgent border-urgent-line" : "bg-surface border-line";
  return (
    <div className={`border-[1.5px] rounded-3xl p-5 ${cardTone}`}>
      <p className="text-xs font-extrabold text-ink-muted uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-black mt-2 ${valueColor}`}>{value}</p>
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//