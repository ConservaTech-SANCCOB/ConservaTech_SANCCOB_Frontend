import { apiFetch } from "./http";

//-----------------------------------------------------------------------------------------------//
//<summary>
// Summary row for a volunteer in the training list: skills completed versus
// required, overall progress percentage and training status.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface TrainingVolunteerSummary {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  completedSkills: number;
  totalRequiredSkills: number;
  progressPercentage: number;
  trainingStatus: string | null;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// A single training skill for a volunteer, including whether it has been signed
// off, by which trainer and when.
//</summary>
//-----------------------------------------------------------------------------------------------//

export interface TrainingSkill {
  skillId: number;
  skillName: string | null;
  category: string | null;
  isSignedOff: boolean;
  trainerId: number | null;
  trainerName: string | null;
  signedOffAt: string | null;
  status: string | null;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Full training profile for one volunteer: overall progress plus their skills
// grouped into supporting areas, pen routines and seasonal skills.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface TrainingVolunteerProfile {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  completedRequiredSkills: number;
  totalRequiredSkills: number;
  progressPercentage: number;
  trainingStatus: string | null;
  supportingAreas: TrainingSkill[] | null;
  penRoutines: TrainingSkill[] | null;
  seasonalSkills: TrainingSkill[] | null;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Headline counts for the training dashboard: total volunteers, how many are
// actively training and how many are fully trained.
//</summary>
//-----------------------------------------------------------------------------------------------//

export interface TrainingDashboard {
  totalVolunteers: number;
  activelyTraining: number;
  trained: number;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// A trainer who can sign off volunteer skills.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface Trainer {
  trainerId: number;
  firstName: string | null;
  lastName: string | null;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Request body for creating a new trainer.
//</summary>
//-----------------------------------------------------------------------------------------------//

export interface CreateTrainerRequest {
  firstName: string;
  lastName: string;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// PUT /api/trainers/{trainerId} (UpdateTrainerDto: firstName, lastName)
// Request body for updating a trainer; same shape as CreateTrainerRequest.
//</summary>
//-----------------------------------------------------------------------------------------------//

export type UpdateTrainerRequest = CreateTrainerRequest;

//-----------------------------------------------------------------------------------------------//
//<summary>
// GET /api/training/volunteers
// Fetches the training summary for every volunteer.
//</summary>
//-----------------------------------------------------------------------------------------------//

export async function fetchTrainingVolunteers(token: string | null): Promise<TrainingVolunteerSummary[]> {
  return apiFetch<TrainingVolunteerSummary[]>("/api/training/volunteers", token, { method: "GET" }, "Unable to fetch training volunteers");
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// GET /api/training/volunteers/{userId}
// Fetches the full training profile (progress and skills) for one volunteer.
//</summary>
//-----------------------------------------------------------------------------------------------//

export async function fetchTrainingVolunteerProfile(userId: number, token: string | null): Promise<TrainingVolunteerProfile> {
  return apiFetch<TrainingVolunteerProfile>(`/api/training/volunteers/${userId}`, token, { method: "GET" }, "Unable to fetch volunteer training profile");
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// GET /api/training/dashboard
// Fetches the headline training counts for the dashboard.
//</summary>
//-----------------------------------------------------------------------------------------------//

export async function fetchTrainingDashboard(token: string | null): Promise<TrainingDashboard> {
  return apiFetch<TrainingDashboard>("/api/training/dashboard", token, { method: "GET" }, "Unable to fetch training dashboard");
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// POST /api/training/volunteers/{userId}/sign-off
// Signs off a skill for a volunteer.
// NOTE: SignOffSkillDto dropped trainerId in the latest Swagger (25 Sep) —
// backend now expects a trainer to be "selected" via POST /api/trainers/{id}/select
// (likely after PIN verification) as a separate session step, not per sign-off call.
// This function is NOT wired into this page yet — flagged, not built.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function signOffSkill(userId: number, skillId: number, token: string | null): Promise<void> {
  return apiFetch<void>(`/api/training/volunteers/${userId}/sign-off`, token, {
    method: "POST",
    body: JSON.stringify({ skillId }),
  }, "Unable to sign off skill");
}


//-----------------------------------------------------------------------------------------------//
//<summary>
// GET /api/trainers
// Fetches the list of all trainers.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function fetchTrainers(token: string | null): Promise<Trainer[]> {
  return apiFetch<Trainer[]>("/api/trainers", token, { method: "GET" }, "Unable to fetch trainers");
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// POST /api/trainers
// Creates a new trainer and returns the created record.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function createTrainer(data: CreateTrainerRequest, token: string | null): Promise<Trainer> {
  return apiFetch<Trainer>("/api/trainers", token, {
    method: "POST",
    body: JSON.stringify(data),
  }, "Unable to create trainer");
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// PUT /api/trainers/{trainerId}
// Updates a trainer's first and last name and returns the updated record.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function updateTrainer(
  trainerId: number,
  data: UpdateTrainerRequest,
  token: string | null
): Promise<Trainer> {
  return apiFetch<Trainer>(`/api/trainers/${trainerId}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  }, "Unable to update trainer");
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// DELETE /api/trainers/{trainerId}
// Deletes a trainer.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function deleteTrainer(trainerId: number, token: string | null): Promise<void> {
  return apiFetch<void>(`/api/trainers/${trainerId}`, token, {
    method: "DELETE",
  }, "Unable to delete trainer");
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//