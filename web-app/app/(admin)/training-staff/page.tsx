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
  updateTrainer,
  deleteTrainer,
  TrainingVolunteerSummary,
  TrainingDashboard,
  TrainingVolunteerProfile,
  Trainer,
} from "../../lib/api/training_staff";
import { isUnauthorized } from "../../lib/api/http";
import { ModalOverlay } from "@/components/shifts/ShiftFormModal";

type Tab = "progress" | "trainers";
type TrainerStatus = "Active" | "Inactive";

const TABS: { label: string; value: Tab }[] = [
  { label: "Volunteer Progress", value: "progress" },
  { label: "Trainers", value: "trainers" },
];

// ---------------------------------------------------------------------------
// PLACEHOLDER STORAGE: TrainerDto has no contact details or status fields yet,
// so these are kept in this browser's localStorage, keyed by trainerId.
// They are NOT shared between devices/admins and the mobile app can't see them.
// Replace with real API fields once the backend adds them.
// ---------------------------------------------------------------------------
interface TrainerExtras {
  contactDetails: string;
  status: TrainerStatus;
}

const EXTRAS_KEY = "sanccob_trainer_extras";
const STATUS_OPTIONS: TrainerStatus[] = ["Active", "Inactive"];

function loadTrainerExtras(): Record<number, TrainerExtras> {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTrainerExtras(extras: Record<number, TrainerExtras>) {
  try {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras));
  } catch {
    // storage unavailable, changes simply won't persist
  }
}

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
  const [trainerExtras, setTrainerExtras] = useState<Record<number, TrainerExtras>>({});

  // Create
  const [showCreateTrainer, setShowCreateTrainer] = useState(false);
  const [trainerFirstName, setTrainerFirstName] = useState("");
  const [trainerLastName, setTrainerLastName] = useState("");
  const [trainerContact, setTrainerContact] = useState("");
  const [isSavingTrainer, setIsSavingTrainer] = useState(false);
  const [createTrainerError, setCreateTrainerError] = useState<string | null>(null);

  // Edit
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTrainerError, setEditTrainerError] = useState<string | null>(null);

  // Delete
  const [deletingTrainer, setDeletingTrainer] = useState<Trainer | null>(null);
  const [isDeletingTrainer, setIsDeletingTrainer] = useState(false);
  const [deleteTrainerError, setDeleteTrainerError] = useState<string | null>(null);

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

  // Restore locally-saved contact details / status once on mount
  useEffect(() => {
    setTrainerExtras(loadTrainerExtras());
  }, []);

  // Only fetch trainers when the Trainers tab is opened
  useEffect(() => {
    if (activeTab === "trainers") loadTrainers();
  }, [activeTab, loadTrainers]);

  const updateTrainerExtras = (trainerId: number, patch: Partial<TrainerExtras>) => {
    const current = trainerExtras[trainerId] ?? { contactDetails: "", status: "Active" as TrainerStatus };
    const next = { ...trainerExtras, [trainerId]: { ...current, ...patch } };
    setTrainerExtras(next);
    saveTrainerExtras(next);
  };

  const removeTrainerExtras = (trainerId: number) => {
    const next = { ...trainerExtras };
    delete next[trainerId];
    setTrainerExtras(next);
    saveTrainerExtras(next);
  };

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

  // ---- Create ----
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateTrainerError(null);
    setIsSavingTrainer(true);
    try {
      const created = await createTrainer(
        { firstName: trainerFirstName.trim(), lastName: trainerLastName.trim() },
        token
      );
      // Contact details can't go to the backend yet, so keep them locally
      if (created?.trainerId != null) {
        updateTrainerExtras(created.trainerId, {
          contactDetails: trainerContact.trim(),
          status: "Active",
        });
      }
      setShowCreateTrainer(false);
      setTrainerFirstName("");
      setTrainerLastName("");
      setTrainerContact("");
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

  // ---- Edit ----
  const openEditTrainer = (t: Trainer) => {
    setEditingTrainer(t);
    setEditFirstName(t.firstName ?? "");
    setEditLastName(t.lastName ?? "");
    setEditContact(trainerExtras[t.trainerId]?.contactDetails ?? "");
    setEditTrainerError(null);
  };

  const handleEditTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;
    setEditTrainerError(null);
    setIsSavingEdit(true);
    try {
      await updateTrainer(
        editingTrainer.trainerId,
        { firstName: editFirstName.trim(), lastName: editLastName.trim() },
        token
      );
      // Contact details can't go to the backend yet, so keep them locally
      updateTrainerExtras(editingTrainer.trainerId, {
        contactDetails: editContact.trim(),
      });
      setEditingTrainer(null);
      await loadTrainers();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setEditTrainerError(err instanceof Error ? err.message : "Unable to update trainer");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ---- Delete ----
  const handleDeleteTrainer = async () => {
    if (!deletingTrainer) return;
    setDeleteTrainerError(null);
    setIsDeletingTrainer(true);
    try {
      await deleteTrainer(deletingTrainer.trainerId, token);
      // Remove the local contact/status entry so it can't attach to a future trainer
      removeTrainerExtras(deletingTrainer.trainerId);
      setDeletingTrainer(null);
      await loadTrainers();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteTrainerError(err instanceof Error ? err.message : "Unable to delete trainer");
    } finally {
      setIsDeletingTrainer(false);
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

  const fullName = (t: Trainer) => `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();

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
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainersLoading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : trainers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No trainers yet</td></tr>
                ) : (
                  trainers.map((t) => {
                    const extras = trainerExtras[t.trainerId];
                    const status: TrainerStatus = extras?.status ?? "Active";
                    return (
                      <tr key={t.trainerId} className="border-b border-slate-50 last:border-0">
                        <td className="px-6 py-4">
                          <div className="w-9 h-9 rounded-full bg-blue-800 text-white flex items-center justify-center text-xs font-semibold">
                            {initials(t)}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{t.firstName}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{t.lastName}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {extras?.contactDetails ? extras.contactDetails : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex rounded-full bg-slate-100 p-0.5">
                            {STATUS_OPTIONS.map((option) => (
                              <button
                                key={option}
                                onClick={() => updateTrainerExtras(t.trainerId, { status: option })}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                  status === option
                                    ? option === "Active"
                                      ? "bg-green-500 text-white shadow-sm"
                                      : "bg-slate-500 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditTrainer(t)}
                              aria-label={`Edit ${fullName(t)}`}
                              title="Edit trainer"
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-700 transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingTrainer(t);
                                setDeleteTrainerError(null);
                              }}
                              aria-label={`Delete ${fullName(t)}`}
                              title="Delete trainer"
                              className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M6 6l1 14h10l1-14" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PLACEHOLDER notice, remove once the backend stores these fields */}
          <p className="mt-3 text-xs text-amber-600">
            Contact details and status are saved in this browser only until the backend supports them.
          </p>
        </>
      )}

      {/* History modal */}
      {selectedProfile && (
        <TrainingHistoryModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
      )}

      {/* Create Trainer modal */}
      {showCreateTrainer && (
        <ModalOverlay onClose={() => setShowCreateTrainer(false)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-black">Create Trainer</h2>
            <button
              type="button"
              onClick={() => setShowCreateTrainer(false)}
              className="text-slate-500 hover:text-slate-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateTrainer} className="space-y-4">
            {/* First & Last name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="trainer-first-name"
                  className="block text-xs font-semibold text-black mb-1.5"
                >
                  First name
                </label>
                <input
                  id="trainer-first-name"
                  name="firstName"
                  required
                  value={trainerFirstName}
                  onChange={(e) => setTrainerFirstName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="trainer-last-name"
                  className="block text-xs font-semibold text-black mb-1.5"
                >
                  Last name
                </label>
                <input
                  id="trainer-last-name"
                  name="lastName"
                  required
                  value={trainerLastName}
                  onChange={(e) => setTrainerLastName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Contact */}
            <div>
              <label
                htmlFor="trainer-contact"
                className="block text-xs font-semibold text-black mb-1.5"
              >
                Contact details
              </label>
              <input
                id="trainer-contact"
                name="contact"
                value={trainerContact}
                onChange={(e) => setTrainerContact(e.target.value)}
                placeholder="Phone number or email"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black placeholder:text-slate-600 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {createTrainerError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {createTrainerError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateTrainer(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-black hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingTrainer}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {isSavingTrainer ? "Saving..." : "Create"}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Edit Trainer modal */}
      {editingTrainer && (
        <ModalOverlay onClose={() => setEditingTrainer(null)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-black">Edit Trainer</h2>
            <button
              type="button"
              onClick={() => setEditingTrainer(null)}
              className="text-slate-500 hover:text-slate-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleEditTrainer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="edit-trainer-first-name"
                  className="block text-xs font-semibold text-black mb-1.5"
                >
                  First name
                </label>
                <input
                  id="edit-trainer-first-name"
                  name="firstName"
                  required
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-trainer-last-name"
                  className="block text-xs font-semibold text-black mb-1.5"
                >
                  Last name
                </label>
                <input
                  id="edit-trainer-last-name"
                  name="lastName"
                  required
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-trainer-contact"
                className="block text-xs font-semibold text-black mb-1.5"
              >
                Contact details
              </label>
              <input
                id="edit-trainer-contact"
                name="contact"
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
                placeholder="Phone number or email"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black placeholder:text-slate-600 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {editTrainerError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {editTrainerError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingTrainer(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-black hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Delete Trainer confirmation modal */}
      {deletingTrainer && (
        <ModalOverlay onClose={() => setDeletingTrainer(null)}>
          <h2 className="text-lg font-bold text-black mb-2">Delete trainer?</h2>
          <p className="text-sm text-slate-700 mb-4">
            {fullName(deletingTrainer)} will be removed from the trainers list. This can&apos;t be undone.
          </p>

          {deleteTrainerError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {deleteTrainerError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingTrainer(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-black hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteTrainer}
              disabled={isDeletingTrainer}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isDeletingTrainer ? "Deleting..." : "Delete trainer"}
            </button>
          </div>
        </ModalOverlay>
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

