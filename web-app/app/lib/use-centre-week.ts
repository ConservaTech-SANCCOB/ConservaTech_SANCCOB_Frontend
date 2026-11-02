"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchShiftsForWeek } from "./api/shifts";
import { fetchWeeklyRoster } from "./api/roster";
import { ApiError, isUnauthorized } from "./api/http";
import { buildCentreWeek, getMonday, toISODate, type CentreWeek } from "./centre-week";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Loads this week's shifts and roster and turns them into a CentreWeek (see centre-week.ts).
// No roster yet is normal (the backend answers 404), so that still gives a week, just with no
// people in it. A 401 logs out, like the other pages. Call reload() after anything that changes
// who is on a shift, for example approving a change request. Pass refreshMs to reload on a timer
// (the room screen does this, so the TV keeps up with changes on its own).
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function useCentreWeek(token: string | null, onUnauthorized: () => void, refreshMs?: number) {
  const [week, setWeek] = useState<CentreWeek | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    if (!refreshMs) return;
    const id = setInterval(() => setReloadKey((k) => k + 1), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const monday = getMonday();
    const weekStart = toISODate(monday);

    Promise.all([
      fetchShiftsForWeek(token, weekStart),
      fetchWeeklyRoster(token, weekStart).catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }),
    ])
      .then(([shifts, roster]) => {
        if (cancelled) return;
        setWeek(buildCentreWeek(monday, shifts, roster));
        setError("");
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          onUnauthorizedRef.current();
          return;
        }
        setError(err instanceof Error ? err.message : "Couldn't load this week's shifts.");
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { week, error, loaded, reload };
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//