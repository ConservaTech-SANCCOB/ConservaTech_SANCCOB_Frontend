"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useAuth } from "./auth-context";
import { isUnauthorized } from "./api/http";
import {
  AdminNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api/notifications";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Notifications older than this are hidden from the bell.
const NOTIFICATION_LIFESPAN_MS = 48 * 60 * 60 * 1000;
// How often an open session re-checks for expired notifications.
const EXPIRY_CHECK_MS = 60 * 1000;

function newestFirst(list: AdminNotification[]): AdminNotification[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// True while a notification is younger than 48 hours. createdAt is UTC and can carry 7 fractional
// digits, so trim to 3 and add "Z" if the backend omitted the timezone. An unparseable date is
// kept rather than silently hidden.
//</summary>
//-----------------------------------------------------------------------------------------------//
function isWithinLifespan(createdAt: string, now: number): boolean {
  let iso = createdAt.replace(/(\.\d{3})\d+/, "$1");
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(iso)) iso += "Z";
  const created = new Date(iso).getTime();
  if (isNaN(created)) return true;
  return now - created < NOTIFICATION_LIFESPAN_MS;
}
//-----------------------------------------------------------------------------------------------------//

export function useNotifications() {
  const { token, logout } = useAuth();
  // Everything the backend / hub has sent. The visible list is filtered from this below.
  const [allItems, setAllItems] = useState<AdminNotification[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  // The hub asks for the token each time it (re)connects, so keep the latest in a ref.
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Tick every minute so notifications expire while the page stays open.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), EXPIRY_CHECK_MS);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchNotifications(token);
      setAllItems(newestFirst(data));
      setNow(Date.now());
      setError("");
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load notifications.");
    }
  }, [token, logout]);

  // Initial list.
  useEffect(() => {
    load();
  }, [load]);

  // Live connection.
  useEffect(() => {
    if (!token || !API_URL) return;
    let cancelled = false;

    const connection = new HubConnectionBuilder()
      // SignalR negotiates the websocket itself, so this is the https URL.
      .withUrl(`${API_URL}/hubs/admin-notifications`, {
        accessTokenFactory: () => tokenRef.current ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
 //-----------------------------------------------------------------------------------------------//

    // Event name is case-sensitive, exactly as the backend sends it.
    connection.on("ReceiveNotification", (n: AdminNotification) => {
      setAllItems((prev) =>
        prev.some((p) => p.notificationId === n.notificationId) ? prev : [n, ...prev]
      );
    });

    connection.onreconnecting(() => setConnected(false));
    connection.onreconnected(() => {
      setConnected(true);
      load(); // pick up anything missed while disconnected
    });
    connection.onclose(() => setConnected(false));

    connection
      .start()
      .then(() => {
        if (!cancelled) setConnected(true);
      })
      .catch((err) => {
        if (!cancelled) console.warn("Notification hub connection failed", err);
      });

    return () => {
      cancelled = true;
      connection.stop();
    };
  }, [token, load]);

//-----------------------------------------------------------------------------------------------//
  const markRead = useCallback(
    async (id: number) => {
      setAllItems((prev) => prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
      try {
        await markNotificationRead(token, id);
      } catch (err) {
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        // put the real state back if the save failed
        load(); 
      }
    },
    [token, logout, load]
  );

  //-------------------------------------------------------------------------------------------------//
  const markAllRead = useCallback(async () => {
    setAllItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead(token);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      load();
    }
  }, [token, logout, load]);

  // Only notifications from the last 48 hours are shown and counted.
  const items = useMemo(
    () => allItems.filter((n) => isWithinLifespan(n.createdAt, now)),
    [allItems, now]
  );

  const unreadCount = items.filter((n) => !n.isRead).length;

  return { items, unreadCount, connected, error, markRead, markAllRead };
}
//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//