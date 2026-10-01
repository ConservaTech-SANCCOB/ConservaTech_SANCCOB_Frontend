import { api } from "../utils/api";

export interface AppNotification {
  notificationId: number;
  message: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function getMyNotifications() {
  const notifications = await api.get<AppNotification[]>("/api/notifications");
  return [...notifications].sort((a, b) => b.notificationId - a.notificationId);
}

// ------------------------------------------------------------ //

export function markNotificationRead(id: number) {
  return api.patch<void>(`/api/notifications/${id}/read`, {});
}

export function registerPushToken(token: string) {
  return api.post<void>("/api/notifications/push-token", {
    token,
  });
}
