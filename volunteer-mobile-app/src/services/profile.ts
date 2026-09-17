import { api } from "../utils/api";

export interface VolunteerProfile {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  nationality: string | null;
  ageBracket: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface UpdateVolunteerProfilePayload {
  email: string;
  phoneNumber?: string | null;
  nationality?: string | null;
  ageBracket?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export function getMyProfile() {
  return api.get<VolunteerProfile>("/api/volunteers/me/profile");
}

export function updateMyProfile(payload: UpdateVolunteerProfilePayload) {
  return api.put<void>("/api/volunteers/me/profile", payload);
}
