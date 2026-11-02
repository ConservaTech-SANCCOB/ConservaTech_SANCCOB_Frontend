"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../lib/auth-context";
import TrainingHistoryModal from "../../../components/training-staff/TrainingHistoryModal";
import {
  fetchTrainingVolunteers,
  fetchTrainingDashboard,
  fetchTrainingVolunteerProfile,
  TrainingVolunteerSummary,
  TrainingDashboard,
  TrainingVolunteerProfile,
} from "../../lib/api/training_staff";
import { apiFetch, isUnauthorized } from "../../lib/api/http";
import { ModalOverlay } from "@/components/shifts/ShiftFormModal";
import { card, cardTitle, buttonPrimary, buttonOutline, input } from "@/components/ui/styles";
import { ICONS, LineIcon } from "@/components/ui/line-icon";

type Tab = "progress" | "trainers";
type TrainerStatus = "active" | "inactive";

//------------------------------------------------------------------------------------------------//

//<summary>
// Trainer shapes for /api/trainers (TrainerDto, CreateTrainerDto, UpdateTrainerDto).
// Email, phone and status are real backend fields now.
//</summary>
interface Trainer {
  trainerId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
}

interface CreateTrainerDto {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

interface UpdateTrainerDto {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status?: TrainerStatus | null;
}

//------------------------------------------------------------------------------------------------//

//<summary>
// The two tabs on the page and their display labels.
//</summary>
const TABS: { label: string; value: Tab }[] = [
  { label: "Volunteers", value: "progress" },
  { label: "Trainers", value: "trainers" },
];

const STATUS_OPTIONS: TrainerStatus[] = ["active", "inactive"];

const JSON_HEADERS = { "Content-Type": "application/json" };

//<summary>
// A trainer counts as Active only when the backend says so.
//</summary>
const isActive = (t: Trainer) => t.status?.toLowerCase() === "active";

//<summary>
// The status to send back on an update: exactly what the backend holds, so an
// edit never silently changes it. Anything unexpected is sent as null.
//</summary>
const statusForUpdate = (t: Trainer): TrainerStatus | null =>
  t.status === "active" || t.status === "inactive" ? t.status : null;

//-------------------------------------------------------------------------------------------//

//<summary>
// Staff Training page. Two tabs:
// - Volunteers: stat cards and each volunteer's training progress, with a link to their history.
// - Trainers: create, edit, activate/deactivate and delete the staff members who sign off training.
//</summary>
export default function TrainingStaffPage() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("progress");

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // State for the Volunteers tab.
  //</summary>
  const [volunteers, setVolunteers] = useState<TrainingVolunteerSummary[]>([]);
  const [dashboard, setDashboard] = useState<TrainingDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<TrainingVolunteerProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // State for the Trainers tab: the list, loading/error state, and which row is mid-toggle.
  //</summary>
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const [trainersError, setTrainersError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // State for the Create Trainer modal.
  //</summary>
  const [showCreateTrainer, setShowCreateTrainer] = useState(false);
  const [trainerFirstName, setTrainerFirstName] = useState("");
  const [trainerLastName, setTrainerLastName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");
  const [trainerPhone, setTrainerPhone] = useState("");
  const [isSavingTrainer, setIsSavingTrainer] = useState(false);
  const [createTrainerError, setCreateTrainerError] = useState<string | null>(null);

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // State for the Edit Trainer modal (editingTrainer = null means closed).
  //</summary>
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTrainerError, setEditTrainerError] = useState<string | null>(null);

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // State for the Delete Trainer confirmation modal (deletingTrainer = null means closed).
  //</summary>
  const [deletingTrainer, setDeletingTrainer] = useState<Trainer | null>(null);
  const [isDeletingTrainer, setIsDeletingTrainer] = useState(false);
  const [deleteTrainerError, setDeleteTrainerError] = useState<string | null>(null);

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Loads the volunteer list and dashboard counts for the Volunteers tab.
  // Logs the user out if the token is rejected.
  //</summary>
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

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Loads the trainer list for the Trainers tab. Also called after create, edit, toggle and
  // delete so the table refreshes. Logs the user out if the token is rejected.
  //</summary>
  const loadTrainers = useCallback(async () => {
    setTrainersLoading(true);
    setTrainersError(null);
    try {
      const data = await apiFetch<Trainer[]>(
        "/api/trainers",
        token,
        { method: "GET" },
        "Unable to load trainers"
      );
      setTrainers(Array.isArray(data) ? data : []);
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

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Loads the Volunteers tab data when the page opens.
  //</summary>
  useEffect(() => {
    loadData();
  }, [loadData]);

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Only fetches trainers when the Trainers tab is opened.
  //</summary>
  useEffect(() => {
    if (activeTab === "trainers") loadTrainers();
  }, [activeTab, loadTrainers]);

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Opens the training history modal for a volunteer.
  //</summary>
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

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Creates a trainer (name, email and phone all go to the API). Clears the form and
  // refreshes the table on success.
  //</summary>
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateTrainerError(null);
    setIsSavingTrainer(true);
    try {
      const payload: CreateTrainerDto = {
        firstName: trainerFirstName.trim(),
        lastName: trainerLastName.trim(),
        email: trainerEmail.trim() || null,
        phone: trainerPhone.trim() || null,
      };
      await apiFetch<Trainer>(
        "/api/trainers",
        token,
        { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) },
        "Unable to create trainer"
      );
      setShowCreateTrainer(false);
      setTrainerFirstName("");
      setTrainerLastName("");
      setTrainerEmail("");
      setTrainerPhone("");
      await loadTrainers();
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

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Opens the Edit Trainer modal, pre-filled with the trainer's current details.
  //</summary>
  const openEditTrainer = (t: Trainer) => {
    setEditingTrainer(t);
    setEditFirstName(t.firstName ?? "");
    setEditLastName(t.lastName ?? "");
    setEditEmail(t.email ?? "");
    setEditPhone(t.phone ?? "");
    setEditTrainerError(null);
  };

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Saves an edited trainer. The current status is sent back unchanged. Closes the modal
  // and refreshes the table on success.
  //</summary>
  const handleEditTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;
    setEditTrainerError(null);
    setIsSavingEdit(true);
    try {
      const payload: UpdateTrainerDto = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        status: statusForUpdate(editingTrainer),
      };
      await apiFetch<Trainer>(
        `/api/trainers/${editingTrainer.trainerId}`,
        token,
        { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(payload) },
        "Unable to update trainer"
      );
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

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Sets a trainer Active or Inactive from the pill toggle in the table. Sends the full
  // trainer with the new status, then refreshes the table.
  //</summary>
  const handleSetStatus = async (t: Trainer, status: TrainerStatus) => {
    if (togglingId !== null) return;
    if ((status === "active") === isActive(t)) return; // already in that state
    setTogglingId(t.trainerId);
    setTrainersError(null);
    try {
      const payload: UpdateTrainerDto = {
        firstName: t.firstName?.trim() ?? "",
        lastName: t.lastName?.trim() ?? "",
        email: t.email?.trim() || null,
        phone: t.phone?.trim() || null,
        status,
      };
      await apiFetch<Trainer>(
        `/api/trainers/${t.trainerId}`,
        token,
        { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(payload) },
        "Unable to update trainer status"
      );
      await loadTrainers();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setTrainersError(err instanceof Error ? err.message : "Unable to update trainer status");
    } finally {
      setTogglingId(null);
    }
  };

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Deletes the trainer chosen in the confirmation modal and refreshes the table. If the
  // backend refuses (e.g. the trainer has signed off skills), the error is shown in the modal.
  //</summary>
  const handleDeleteTrainer = async () => {
    if (!deletingTrainer) return;
    setDeleteTrainerError(null);
    setIsDeletingTrainer(true);
    try {
      await apiFetch<void>(
        `/api/trainers/${deletingTrainer.trainerId}`,
        token,
        { method: "DELETE" },
        "Unable to delete trainer"
      );
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

  //-------------------------------------------------------------------------------------------//

  //<summary>
  // Helpers for display: initials for an avatar, a trainer's full name for labels, and the
  // filtered + sorted volunteer list (furthest along first, filtered by the search box).
  //</summary>
  const initialsOf = (first: string | null, last: string | null) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";

  const fullName = (t: Trainer) => `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();

  const filteredVolunteers = volunteers
    .filter((v) =>
      `${v.firstName ?? ""} ${v.lastName ?? ""}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .slice()
    .sort((a, b) => b.progressPercentage - a.progressPercentage);

  const notStarted = dashboard
    ? Math.max(0, dashboard.totalVolunteers - dashboard.trained - dashboard.activelyTraining)
    : 0;

  return (
    <div className="p-8">
      {/*------------------------- Hero banner ---------------------------------*/}

      <div className="relative overflow-hidden rounded-3xl bg-[#24621A] text-white px-8 py-7 mb-6 flex flex-wrap items-end justify-between gap-5">
        <div className="relative flex flex-col gap-2 max-w-xl">
          <span className="font-black text-xs tracking-[0.18em] uppercase text-[#C8F0B4]">
            Track skills
          </span>
          <h1 className="text-3xl font-black">Staff Training</h1>
          <p className="text-sm font-semibold text-white/90">
            {activeTab === "progress"
              ? "Supporting areas first, then pen routines, then home pen."
              : "Manage the staff members who sign off volunteer training."}
          </p>
        </div>
        {activeTab === "trainers" && (
          <button onClick={() => setShowCreateTrainer(true)} className={`${buttonPrimary} relative`}>
            <LineIcon d={ICONS.plus} size={18} />
            Create Trainer
          </button>
        )}
      </div>

      {/*------------------------- Tabs ---------------------------------*/}

      <div className="inline-flex items-center gap-1 rounded-full bg-surface-muted p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition-all flex items-center gap-2 ${
              activeTab === tab.value
                ? "bg-surface text-ink-strong shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
            <span className="text-xs font-bold text-ink-faint">
              {tab.value === "progress" ? volunteers.length : trainers.length}
            </span>
          </button>
        ))}
      </div>

      {/*------------------------- Volunteers tab ---------------------------------*/}

      {activeTab === "progress" && (
        <>
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-urgent border border-urgent-line text-sm font-bold text-urgent-ink flex items-center justify-between gap-3">
              {error}
              <button onClick={loadData} className="font-black underline shrink-0">Try again</button>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Fully trained" value={dashboard?.trained ?? "—"} sub="All required skills signed off" tone="ok" />
            <StatCard label="In training" value={dashboard?.activelyTraining ?? "—"} sub="Working through the stages" tone="brand" />
            <StatCard label="Not started" value={dashboard ? notStarted : "—"} sub="No skills signed off yet" tone="muted" />
          </div>

          {/* Search */}
          <div className="flex flex-col gap-2 mb-4 max-w-md">
            <label htmlFor="train-search" className="text-sm font-extrabold text-ink-strong">
              Find a volunteer
            </label>
            <div className="relative">
              <LineIcon
                d={ICONS.search}
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                id="train-search"
                type="search"
                placeholder="Type a name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${input} pl-11`}
              />
            </div>
          </div>

          {/* Volunteer progress list */}
          <div className={card}>
            {isLoading ? (
              <p className="px-6 py-8 text-center text-ink-faint font-semibold">Loading...</p>
            ) : filteredVolunteers.length === 0 ? (
              <p className="px-6 py-8 text-center text-ink-faint font-semibold">
                {volunteers.length === 0 ? "No volunteers in training" : "No volunteers match that search"}
              </p>
            ) : (
              filteredVolunteers.map((v, i) => (
                <TrainingRow
                  key={v.userId}
                  volunteer={v}
                  initials={initialsOf(v.firstName, v.lastName)}
                  isLast={i === filteredVolunteers.length - 1}
                  onViewHistory={() => handleOpenHistory(v.userId)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/*------------------------- Trainers tab ---------------------------------*/}

      {activeTab === "trainers" && (
        <>
          {trainersError && (
            <div className="mb-4 p-4 rounded-2xl bg-urgent border border-urgent-line text-sm font-bold text-urgent-ink flex items-center justify-between gap-3">
              {trainersError}
              <button onClick={loadTrainers} className="font-black underline shrink-0">Try again</button>
            </div>
          )}

          {/* Trainers list */}
          <div className={card}>
            {trainersLoading ? (
              <p className="px-6 py-8 text-center text-ink-faint font-semibold">Loading...</p>
            ) : trainers.length === 0 ? (
              <p className="px-6 py-8 text-center text-ink-faint font-semibold">No trainers yet</p>
            ) : (
              trainers.map((t, i) => {
                const status: TrainerStatus = isActive(t) ? "active" : "inactive";
                const isToggling = togglingId === t.trainerId;
                return (
                  <div
                    key={t.trainerId}
                    className={`flex flex-wrap items-center gap-4 px-6 py-4 ${
                      i !== trainers.length - 1 ? "border-b border-line-soft" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand text-brand-ink font-black text-sm flex items-center justify-center shrink-0">
                      {initialsOf(t.firstName, t.lastName)}
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <p className="font-extrabold text-ink-strong">{fullName(t)}</p>
                      <p className="text-sm text-ink-muted">
                        {t.email || t.phone ? (
                          <>
                            {t.email}
                            {t.email && t.phone && " · "}
                            {t.phone}
                          </>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>

                    {/* Active / Inactive toggle (saved to the backend) */}
                    <div className="inline-flex rounded-full bg-surface-muted p-1">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleSetStatus(t, option)}
                          className={`rounded-full px-4 py-1.5 text-xs font-extrabold capitalize transition-all disabled:opacity-60 ${
                            status === option
                              ? option === "active"
                                ? "bg-ok text-ok-ink"
                                : "bg-surface text-ink-strong shadow-sm"
                              : "text-ink-muted hover:text-ink"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    {/* Edit / delete actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditTrainer(t)}
                        aria-label={`Edit ${fullName(t)}`}
                        title="Edit trainer"
                        className="p-2.5 rounded-xl text-ink-muted hover:bg-tint hover:text-brand transition-colors"
                      >
                        <LineIcon d={ICONS.edit} size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingTrainer(t);
                          setDeleteTrainerError(null);
                        }}
                        aria-label={`Delete ${fullName(t)}`}
                        title="Delete trainer"
                        className="p-2.5 rounded-xl text-ink-muted hover:bg-urgent hover:text-urgent-ink transition-colors"
                      >
                        <LineIcon d={ICONS.trash} size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/*------------------------- History modal ---------------------------------*/}
      {selectedProfile && (
        <TrainingHistoryModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
      )}

      {/*------------------------- Create Trainer modal ---------------------------------*/}

      {showCreateTrainer && (
        <ModalOverlay onClose={() => setShowCreateTrainer(false)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={cardTitle}>Create Trainer</h2>
            <button
              type="button"
              onClick={() => setShowCreateTrainer(false)}
              className="text-ink-muted hover:text-ink-strong"
              aria-label="Close"
            >
              <LineIcon d={ICONS.close} size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateTrainer} className="space-y-4">
            {/* First & last name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="trainer-first-name" className="block text-xs font-extrabold text-ink-strong mb-1.5">
                  First name
                </label>
                <input
                  id="trainer-first-name"
                  name="firstName"
                  required
                  maxLength={100}
                  value={trainerFirstName}
                  onChange={(e) => setTrainerFirstName(e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="trainer-last-name" className="block text-xs font-extrabold text-ink-strong mb-1.5">
                  Last name
                </label>
                <input
                  id="trainer-last-name"
                  name="lastName"
                  required
                  maxLength={100}
                  value={trainerLastName}
                  onChange={(e) => setTrainerLastName(e.target.value)}
                  className={input}
                />
              </div>
            </div>

            {/* Email & phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="trainer-email" className="block text-xs font-extrabold text-ink-strong mb-1.5">
                  Email
                </label>
                <input
                  id="trainer-email"
                  name="email"
                  type="email"
                  maxLength={255}
                  value={trainerEmail}
                  onChange={(e) => setTrainerEmail(e.target.value)}
                  placeholder="trainer@example.com"
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="trainer-phone" className="block text-xs font-extrabold text-ink-strong mb-1.5">
                  Phone
                </label>
                <input
                  id="trainer-phone"
                  name="phone"
                  type="tel"
                  maxLength={30}
                  value={trainerPhone}
                  onChange={(e) => setTrainerPhone(e.target.value)}
                  placeholder="Phone number"
                  className={input}
                />
              </div>
            </div>

            {createTrainerError && (
              <p className="text-sm font-bold text-urgent-ink bg-urgent border border-urgent-line rounded-2xl px-4 py-2.5">
                {createTrainerError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateTrainer(false)} className={buttonOutline}>
                Cancel
              </button>
              <button type="submit" disabled={isSavingTrainer} className={buttonPrimary}>
                {isSavingTrainer ? "Saving..." : "Create"}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/*------------------------- Edit Trainer modal ---------------------------------*/}

      {editingTrainer && (
        <ModalOverlay onClose={() => setEditingTrainer(null)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={cardTitle}>Edit Trainer</h2>
            <button
              type="button"
              onClick={() => setEditingTrainer(null)}
              className="text-ink-muted hover:text-ink-strong"
              aria-label="Close"
            >
              <LineIcon d={ICONS.close} size={20} />
            </button>
          </div>

          <form onSubmit={handleEditTrainer} className="space-y-4">
            {/* First & last name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-trainer-first-name" className="block text-xs font-extrabold text-ink-strong mb-1.5">
                  First name
                </label>
                <input
                  id="edit-trainer-first-name"
                  name="firstName"
                  required
                  maxLength={100}
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="edit-trainer-last-name" className="block text-xs font-extrabold text-ink-strong mb-1.5">
                  Last name
                </label>
                <input
                  id="edit-trainer-last-name"
                  name="lastName"
                  required
                  maxLength={100}
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className={input}
                />
              </div>
            </div>

            {/* Email & phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-trainer-email" className="block text-xs font-extrabold text-ink-strong mb-1.5">
                  Email
                </label>
                <input
                  id="edit-trainer-email"
                  name="email"
                  type="email"
                  maxLength={255}
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="trainer@example.com"
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="edit-trainer-phone" className="block text-xs font-extrabold text-ink-strong mb-1.5">
                  Phone
                </label>
                <input
                  id="edit-trainer-phone"
                  name="phone"
                  type="tel"
                  maxLength={30}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Phone number"
                  className={input}
                />
              </div>
            </div>

            {editTrainerError && (
              <p className="text-sm font-bold text-urgent-ink bg-urgent border border-urgent-line rounded-2xl px-4 py-2.5">
                {editTrainerError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingTrainer(null)} className={buttonOutline}>
                Cancel
              </button>
              <button type="submit" disabled={isSavingEdit} className={buttonPrimary}>
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/*------------------------- Delete Trainer confirmation modal ---------------------------------*/}

      {deletingTrainer && (
        <ModalOverlay onClose={() => setDeletingTrainer(null)}>
          <h2 className={`${cardTitle} mb-2`}>Delete trainer?</h2>
          <p className="text-sm font-semibold text-ink mb-4">
            {fullName(deletingTrainer)} will be removed from the trainers list. This can&apos;t be undone.
          </p>

          {deleteTrainerError && (
            <p className="text-sm font-bold text-urgent-ink bg-urgent border border-urgent-line rounded-2xl px-4 py-2.5 mb-4">
              {deleteTrainerError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDeletingTrainer(null)} className={buttonOutline}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteTrainer}
              disabled={isDeletingTrainer}
              className="min-h-12 px-5 rounded-full bg-[#B42318] hover:bg-[#9A1D14] text-white font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
            >
              {isDeletingTrainer ? "Deleting..." : "Delete trainer"}
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

//---------------------------------------------------------------//

//<summary>
// A summary card used at the top of the Volunteers tab: an uppercase label, a
// large value and a short caption, tinted by tone.
//</summary>
function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: "ok" | "brand" | "muted";
}) {
  const valueColor =
    tone === "ok" ? "text-ok-ink" : tone === "brand" ? "text-brand" : "text-ink-strong";
  return (
    <div className={`${card} p-5`}>
      <p className="text-xs font-extrabold text-ink-muted uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-black mt-2 ${valueColor}`}>{value}</p>
      <p className="text-sm text-ink-faint mt-1">{sub}</p>
    </div>
  );
}

//---------------------------------------------------------------//

//<summary>
// One row in the Volunteers progress list: initials avatar, name, a status chip
// (fully trained / not started), an overall progress bar, the skill count and a
// button that opens the full training-history modal.
//</summary>
function TrainingRow({
  volunteer,
  initials,
  isLast,
  onViewHistory,
}: {
  volunteer: TrainingVolunteerSummary;
  initials: string;
  isLast: boolean;
  onViewHistory: () => void;
}) {
  const pct = Math.round(volunteer.progressPercentage);
  const isFull = volunteer.totalRequiredSkills > 0 && volunteer.completedSkills >= volunteer.totalRequiredSkills;
  const notStarted = volunteer.completedSkills === 0;

  return (
    <div
      className={`flex flex-wrap items-center gap-4 px-6 py-4 ${isLast ? "" : "border-b border-line-soft"}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-[220px]">
        <div className="w-10 h-10 rounded-full bg-brand text-brand-ink font-black text-sm flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-ink-strong">
              {volunteer.firstName} {volunteer.lastName}
            </span>
            {isFull && (
              <span className="text-xs font-extrabold rounded-full px-2.5 py-0.5 bg-ok text-ok-ink">
                Fully trained
              </span>
            )}
            {!isFull && notStarted && (
              <span className="text-xs font-extrabold rounded-full px-2.5 py-0.5 bg-surface-muted text-ink-muted">
                Not started
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-[2_1_240px] min-w-[200px]">
        <div className="flex-1 h-3 rounded-full bg-surface-sunken overflow-hidden">
          <div className="h-full rounded-full bg-ok-bar" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-extrabold text-ink-strong w-11 text-right">{pct}%</span>
      </div>

      <div className="flex flex-col gap-0.5 flex-none">
        <span className="font-black text-ink-strong">
          {volunteer.completedSkills} of {volunteer.totalRequiredSkills}
        </span>
        <span className="text-xs text-ink-faint">skills signed off</span>
      </div>

      <button onClick={onViewHistory} className={`${buttonOutline} ml-auto`}>
        View history
        <LineIcon d={ICONS.arrowRight} size={16} />
      </button>
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0----------------------------------------------//