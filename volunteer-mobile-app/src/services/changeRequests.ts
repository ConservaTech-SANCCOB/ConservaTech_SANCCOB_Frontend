import { api } from "../utils/api";

export interface CreateChangeRequestPayload {
  rosterAssignmentId: number;
  reason: string;
}

export function submitChangeRequest(payload: CreateChangeRequestPayload) {
  return api.post<void>("/api/change-requests", payload);
}

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
