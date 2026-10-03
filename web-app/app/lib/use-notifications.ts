"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

function newestFirst(list: AdminNotification[]): AdminNotification[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
//-----------------------------------------------------------------------------------------------------//

export function useNotifications() {
  const { token, logout } = useAuth();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  // The hub asks for the token each time it (re)connects, so keep the latest in a ref.
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchNotifications(token);
      setItems(newestFirst(data));
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
      setItems((prev) =>
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
      setItems((prev) => prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
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
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
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

  const unreadCount = items.filter((n) => !n.isRead).length;

  return { items, unreadCount, connected, error, markRead, markAllRead };
}
//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//