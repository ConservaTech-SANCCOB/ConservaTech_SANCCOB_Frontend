import { apiFetch } from "./http";

// Same shape from GET /api/admin/notifications and the live "ReceiveNotification" push.
export interface AdminNotification {
  notificationId: number;
  eventType: string; // volunteer_registered | change_request_submitted | shift_vacant
  message: string;
  relatedId: number | null;
  createdAt: string; // ISO, UTC
  isRead: boolean;
}

// GET /api/admin/notifications
export async function fetchNotifications(
  token: string | null,
  unreadOnly = false
): Promise<AdminNotification[]> {
  const data = await apiFetch<AdminNotification[]>(
    `/api/admin/notifications${unreadOnly ? "?unreadOnly=true" : ""}`,
    token,
    { method: "GET" },
    "Unable to load notifications"
  );
  return Array.isArray(data) ? data : [];
}

// PATCH /api/admin/notifications/{id}/read
export async function markNotificationRead(token: string | null, id: number): Promise<void> {
  await apiFetch<void>(
    `/api/admin/notifications/${id}/read`,
    token,
    { method: "PATCH" },
    "Unable to mark notification as read"
  );
}

// PATCH /api/admin/notifications/read-all
export async function markAllNotificationsRead(token: string | null): Promise<void> {
  await apiFetch<void>(
    "/api/admin/notifications/read-all",
    token,
    { method: "PATCH" },
    "Unable to mark notifications as read"
  );
}

// POST /api/notifications/open-vacancy/{shiftId}
export async function notifyOpenVacancy(token: string | null, shiftId: number): Promise<void> {
  await apiFetch<void>(
    `/api/notifications/open-vacancy/${shiftId}`,
    token,
    { method: "POST" },
    "Unable to notify volunteers"
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//