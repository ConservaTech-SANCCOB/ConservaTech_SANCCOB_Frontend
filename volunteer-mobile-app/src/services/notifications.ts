import { api } from "../utils/api";

export interface AppNotification {
  notificationId: number;
  message: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
}

// Read ones are dropped so they never come back
export async function getMyNotifications() {
  const notifications = await api.get<AppNotification[]>("/api/notifications");
  return notifications.filter((n) => !n.isRead).sort((a, b) => b.notificationId - a.notificationId);
}

// ------------------------------------------------------------ //

export async function markNotificationRead(id: number) {
  await api.patch<void>(`/api/notifications/${id}/read`, {});
}

export function registerPushToken(token: string) {
  return api.post<void>("/api/notifications/push-token", {
    token,
  });
}