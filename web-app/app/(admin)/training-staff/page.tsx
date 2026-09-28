"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../lib/auth-context";
import TrainingHistoryModal from "../../../components/training-staff/TrainingHistoryModal";
import {
  fetchTrainingVolunteers,
  fetchTrainingDashboard,
  fetchTrainingVolunteerProfile,
  fetchTrainers,
  createTrainer,
  TrainingVolunteerSummary,
  TrainingDashboard,
  TrainingVolunteerProfile,
  Trainer,
} from "../../lib/api/training_staff";
import { isUnauthorized } from "../../lib/api/http";

type Tab = "progress" | "trainers";

const TABS: { label: string; value: Tab }[] = [
  { label: "Volunteer Progress", value: "progress" },
  { label: "Trainers", value: "trainers" },
];

export default function TrainingStaffPage() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("progress");

  // ---- Volunteer Progress tab ----
  const [volunteers, setVolunteers] = useState<TrainingVolunteerSummary[]>([]);
  const [dashboard, setDashboard] = useState<TrainingDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<TrainingVolunteerProfile | null>(null);

  // ---- Trainers tab ----
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const [trainersError, setTrainersError] = useState<string | null>(null);

  const [showCreateTrainer, setShowCreateTrainer] = useState(false);
  const [trainerFirstName, setTrainerFirstName] = useState("");
  const [trainerLastName, setTrainerLastName] = useState("");
  const [isSavingTrainer, setIsSavingTrainer] = useState(false);
  const [createTrainerError, setCreateTrainerError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vols, dash] = await Promise.all([
        fetchTrainingVolunteers(token),
        fetchTrainingDashboard(token),
      ]);
      setVolunteers(vols);
      setDashboard(dash);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load training data");
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  const loadTrainers = useCallback(async () => {
    setTrainersLoading(true);
    setTrainersError(null);
    try {
      setTrainers(await fetchTrainers(token));
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setTrainersError(err instanceof Error ? err.message : "Failed to load trainers");
    } finally {
      setTrainersLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Only fetch trainers when the Trainers tab is opened
  useEffect(() => {
    if (activeTab === "trainers") loadTrainers();
  }, [activeTab, loadTrainers]);

  const handleOpenHistory = async (userId: number) => {
    try {
      const profile = await fetchTrainingVolunteerProfile(userId, token);
      setSelectedProfile(profile);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load training history");
    }
  };

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateTrainerError(null);
    setIsSavingTrainer(true);
    try {
      await createTrainer(
        { firstName: trainerFirstName.trim(), lastName: trainerLastName.trim() },
        token
      );
      setShowCreateTrainer(false);
      setTrainerFirstName("");
      setTrainerLastName("");
      await loadTrainers(); // refresh so the new trainer shows in the table
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setCreateTrainerError(err instanceof Error ? err.message : "Unable to create trainer");
    } finally {
      setIsSavingTrainer(false);
    }
  };

  const averageProgress =
    volunteers.length > 0
      ? Math.round(
          volunteers.reduce((sum, v) => sum + v.progressPercentage, 0) / volunteers.length
        )
      : 0;

  const initials = (t: Trainer) =>
    `${t.firstName?.[0] ?? ""}${t.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Training</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === "progress"
              ? "Track volunteer training progress through all certification stages"
              : "Manage the staff members who sign off volunteer training"}
          </p>
        </div>
        {activeTab === "trainers" && (
          <button
            onClick={() => setShowCreateTrainer(true)}
            className="rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
          >
            + Create Trainer
          </button>
        )}
      </div>

     {/* Tabs */}
     <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 mb-6">
      {TABS.map((tab) => (
       <button
      key={tab.value}
      onClick={() => setActiveTab(tab.value)}
      className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
        activeTab === tab.value
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
           }`}
           >
          {tab.label}
         </button>
       ))}
     </div>
      {/* ================= Volunteer Progress tab ================= */}
      {activeTab === "progress" && (
        <>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-center justify-between">
              {error}
              <button onClick={loadData} className="font-semibold underline">Try again</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Completed Training" value={dashboard?.trained ?? "—"} sub="Full certification achieved" />
            <StatCard label="Currently Training" value={dashboard?.activelyTraining ?? "—"} sub="Actively progressing" />
            <StatCard label="Average Progress" value={`${averageProgress}%`} sub="Across all volunteers" />
          </div>

          <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                  <th className="px-6 py-3">Volunteer</th>
                  <th className="px-6 py-3">Overall Progress</th>
                  <th className="px-6 py-3">Modules</th>
                  <th className="px-6 py-3">History</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : volunteers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No volunteers in training</td></tr>
                ) : (
                  volunteers.map((v) => (
                    <tr key={v.userId} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {v.firstName} {v.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 w-40">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-800"
                              style={{ width: `${v.progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {Math.round(v.progressPercentage)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {v.completedSkills} / {v.totalRequiredSkills}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleOpenHistory(v.userId)}
                          className="text-xs font-semibold text-blue-800 hover:underline"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= Trainers tab ================= */}
      {activeTab === "trainers" && (
        <>
          {trainersError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-center justify-between">
              {trainersError}
              <button onClick={loadTrainers} className="font-semibold underline">Try again</button>
            </div>
          )}

          <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                  <th className="px-6 py-3">Profile</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Surname</th>
                  <th className="px-6 py-3">Contact Details</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {trainersLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : trainers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No trainers yet</td></tr>
                ) : (
                  trainers.map((t) => (
                    <tr key={t.trainerId} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-4">
                        <div className="w-9 h-9 rounded-full bg-blue-800 text-white flex items-center justify-center text-xs font-semibold">
                          {initials(t)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{t.firstName}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{t.lastName}</td>
                      {/* Not in TrainerDto yet, placeholders until the backend adds these fields */}
                      <td className="px-6 py-4 text-slate-400">—</td>
                      <td className="px-6 py-4 text-slate-400">—</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* History modal */}
      {selectedProfile && (
        <TrainingHistoryModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
      )}

      {/* Create Trainer modal */}
      {showCreateTrainer && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create Trainer</h2>
            {createTrainerError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {createTrainerError}
              </div>
            )}
            <form onSubmit={handleCreateTrainer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First name</label>
                <input
                  required
                  value={trainerFirstName}
                  onChange={(e) => setTrainerFirstName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last name</label>
                <input
                  required
                  value={trainerLastName}
                  onChange={(e) => setTrainerLastName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTrainer(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTrainer}
                  className="flex-1 rounded-lg bg-blue-900 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isSavingTrainer ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}