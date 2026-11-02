"use client";

import { useEffect, useRef, useState } from "react";
import { isUnauthorized } from "./api/http";

//-----------------------------------------------------------------------------------------------//
//<summary>
// The loading, error and data state for one part of a page.
//</summary>
//-----------------------------------------------------------------------------------------------//
export interface Section<T> {
  data: T | null;
  error: string;
  loaded: boolean;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Loads one part of a page on its own, so one failing endpoint only shows an error in that part
// instead of blanking the whole page. A 401 calls onUnauthorized (log out), and the admin layout
// then redirects to login. Pass a memoised loader (useMemo) or null to wait, e.g. for the token.
// Moved here unchanged from the old Dashboard page so other pages can use it too.
//</summary>
//-----------------------------------------------------------------------------------------------//
export function useSection<T>(load: (() => Promise<T>) | null, onUnauthorized: () => void) {
  const [state, setState] = useState<Section<T>>({ data: null, error: "", loaded: false });
  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    if (!load) return;
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setState({ data, error: "", loaded: true });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          onUnauthorizedRef.current();
          return;
        }
        setState({
          data: null,
          error: err instanceof Error ? err.message : "Something went wrong.",
          loaded: true,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return [state, setState] as const;
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//