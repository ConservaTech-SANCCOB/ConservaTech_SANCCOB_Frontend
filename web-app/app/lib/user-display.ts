import type { AuthUser } from "./auth-context";

// Initials for the avatar circle: first + last word of the name ("Cathy Adams"
// -> "CA"). Falls back to the first letter of the email, then "?".
export function getInitials(user: AuthUser | null): string {
  const name = (user?.name ?? "").trim();
  if (name) {
    const parts = name.split(/\s+/);
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }
  const email = (user?.email ?? "").trim();
  if (email) return email[0].toUpperCase();
  return "?";
}

//-------------------------------------------------------------------------------------------------//

// Name shown next to the avatar. A token issued before the backend added the
// name claim has no name, so fall back to the email, then a neutral label.
export function getDisplayName(user: AuthUser | null): string {
  return user?.name?.trim() || user?.email?.trim() || "Admin";
}

//-------------------------------------------------------------------------------------------------//

// First name for greetings ("Cathy Adams" -> "Cathy"). Falls back to the
// email's local part, then a neutral word, for tokens without a name claim.
export function getFirstName(user: AuthUser | null): string {
  const name = (user?.name ?? "").trim();
  if (name) return name.split(/\s+/)[0];
  const email = (user?.email ?? "").trim();
  if (email) return email.split("@")[0];
  return "there";
}

//-------------------------------------------------------------------------------------------------//
// "Admin" -> "Administrator"; any other role is shown as-is.
export function getRoleLabel(role: string | null): string {
  if (!role) return "";
  return role.toLowerCase() === "admin" ? "Administrator" : role;
}
//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//