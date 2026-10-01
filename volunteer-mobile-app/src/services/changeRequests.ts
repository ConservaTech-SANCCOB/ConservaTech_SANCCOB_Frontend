import { api } from "../utils/api";

export interface CreateChangeRequestPayload {
  rosterAssignmentId: number;
  reason: string;
}

// Volunteer stays on the shift until approved
export function submitChangeRequest(payload: CreateChangeRequestPayload) {
  return api.post<void>("/api/change-requests", payload);
}

// ------------------------------------------------------------ //

export interface ChangeRequest {
  requestId: number;
  rosterAssignmentId: number;
  reason: string | null;
  status: string | null;
  shiftDate: string;
  timeSlot: string | null;
  volunteerName: string | null;
}

export function getMyChangeRequests() {
  return api.get<ChangeRequest[]>("/api/change-requests/me");
}

// ------------------------------------------------------------ //

export type ChangeRequestStatus = "pending" | "approved" | "declined";

// Backend sends Pending so compare in lower case
export function parseChangeRequestStatus(status: string | null): ChangeRequestStatus | null {
  const s = status?.trim().toLowerCase();
  return s === "pending" || s === "approved" || s === "declined" ? s : null;
}

// ------------------------------------------------------------ //

// Cards hide Cancel for these assignments
export async function getPendingCancellationIds(): Promise<Set<number>> {
  const requests = await getMyChangeRequests();
  return new Set(
    requests.filter((r) => parseChangeRequestStatus(r.status) === "pending").map((r) => r.rosterAssignmentId)
  );
}

//----------------------------------- END OF FILE ---------------------------------//
