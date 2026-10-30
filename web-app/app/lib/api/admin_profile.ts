import { apiFetch } from "./http";

//-----------------------------------------------------------------------------------------------//
//<summary>
// Request body for updating the signed-in admin's own profile
// (UpdateAdminProfileDto). All three fields are required by the backend.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface UpdateAdminProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// PUT /api/admin/profile
// Updates the signed-in admin's first name, last name and email. The backend
// returns no body, so callers should update their own local copy afterwards.
//</summary>
//-----------------------------------------------------------------------------------------------//
export async function updateAdminProfile(
  token: string | null,
  payload: UpdateAdminProfilePayload
): Promise<void> {
  await apiFetch<void>(
    "/api/admin/profile",
    token,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim(),
      }),
    },
    "Unable to update profile"
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//