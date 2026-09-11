import { api } from "../utils/api";

export interface AppNotification {
  notificationId: number;
  message: string;
  type: string | null;
  isRead: boolean;
}

export function getMyNotifications() {
  return api.get<AppNotification[]>("/api/notifications");
}

export function markNotificationRead(id: number) {
  return api.patch<void>(`/api/notifications/${id}/read`, {});
}