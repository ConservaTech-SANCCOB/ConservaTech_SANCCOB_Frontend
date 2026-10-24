import * as SecureStore from "expo-secure-store";
import { api } from "../utils/api";
import { parseBackendTimestamp } from "../utils/dateBuckets";
import { logError } from "../utils/logError";

export interface AppNotification {
  notificationId: number;
  message: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
}

const READ_TIMES_KEY = "notificationReadTimes";
const CLEARED_AT_KEY = "notificationsClearedAt";
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

async function loadClearedAt(): Promise<number> {
  try {
    const stored = await SecureStore.getItemAsync(CLEARED_AT_KEY);
    return stored ? Number(stored) : 0;
  } catch (error) {
    logError("Load notifications cleared time failed", error);
    return 0;
  }
}

// Unreadable timestamps stay visible rather than vanish
function createdAfter(notification: AppNotification, clearedAt: number): boolean {
  const created = parseBackendTimestamp(notification.createdAt).getTime();
  return Number.isNaN(created) || created > clearedAt;
}

export async function getMyNotifications() {
  const [all, clearedAt] = await Promise.all([api.get<AppNotification[]>("/api/notifications"), loadClearedAt()]);
  const notifications = all.filter((n) => createdAfter(n, clearedAt));
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

// ------------------------------------------------------------ //

// No volunteer clear endpoint exists
export async function clearAllNotifications(notifications: AppNotification[]) {
  const unread = notifications.filter((n) => !n.isRead);
  await Promise.all(unread.map((n) => api.patch<void>(`/api/notifications/${n.notificationId}/read`, {})));
  // Server time keeps newer notifications visible
  const newest = Math.max(
    0,
    ...notifications.map((n) => parseBackendTimestamp(n.createdAt).getTime()).filter((t) => !Number.isNaN(t))
  );
  await SecureStore.setItemAsync(CLEARED_AT_KEY, String(Math.max(newest, await loadClearedAt())));
}

export function registerPushToken(token: string) {
  return api.post<void>("/api/notifications/push-token", {
    token,
  });
}
