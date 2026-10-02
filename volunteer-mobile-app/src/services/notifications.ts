import * as SecureStore from "expo-secure-store";
import { api } from "../utils/api";
import { logError } from "../utils/logError";

export interface AppNotification {
  notificationId: number;
  message: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
}

const READ_TIMES_KEY = "notificationReadTimes";
const HIDE_READ_AFTER_MS = 24 * 60 * 60 * 1000;

type ReadTimes = Record<string, number>;

// The backend has no read time so this device keeps one
async function loadReadTimes(): Promise<ReadTimes> {
  try {
    const stored = await SecureStore.getItemAsync(READ_TIMES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    logError("Load notification read times failed", error);
    return {};
  }
}

async function saveReadTimes(readTimes: ReadTimes) {
  try {
    await SecureStore.setItemAsync(READ_TIMES_KEY, JSON.stringify(readTimes));
  } catch (error) {
    logError("Save notification read times failed", error);
  }
}

export async function getMyNotifications() {
  const notifications = await api.get<AppNotification[]>("/api/notifications");
  const storedReadTimes = await loadReadTimes();
  const now = Date.now();

  const readTimes: ReadTimes = {};
  for (const notification of notifications) {
    if (notification.isRead) {
      readTimes[notification.notificationId] = storedReadTimes[notification.notificationId] ?? now;
    }
  }
  await saveReadTimes(readTimes);

  return notifications
    .filter((n) => !n.isRead || now - readTimes[n.notificationId] < HIDE_READ_AFTER_MS)
    .sort((a, b) => b.notificationId - a.notificationId);
}

// ------------------------------------------------------------ //

export async function markNotificationRead(id: number) {
  await api.patch<void>(`/api/notifications/${id}/read`, {});
  const readTimes = await loadReadTimes();
  readTimes[id] ??= Date.now();
  await saveReadTimes(readTimes);
}

export function registerPushToken(token: string) {
  return api.post<void>("/api/notifications/push-token", {
    token,
  });
}
