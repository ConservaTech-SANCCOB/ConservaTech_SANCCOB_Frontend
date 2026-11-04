//---------------------------------------------------------------------------------------------------------------//
//<summary>
// One rule for which roster assignments count as a person on a shift: only "Assigned" ones.
// "Vacant" (removed) and "Conflict" (unresolved) rows don't use up shift capacity. This matches
// how the backend counts assignedVolunteers and vacanciesAvailable.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function isActiveAssignment(status: string | null | undefined): boolean {
  return status?.toLowerCase() === "assigned";
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//