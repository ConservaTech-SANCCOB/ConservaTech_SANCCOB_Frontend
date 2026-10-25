"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "sanccob-theme";

// Used when nothing is saved yet. Keep "light" until every page has dark:
// variants, then switch to "system" (and mirror the change in the inline
// script in app/layout.tsx).

const DEFAULT_THEME: Theme = "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Tiny external store so the saved preference can be read without a
// setState-in-effect (and without a server/client hydration mismatch).

const listeners = new Set<() => void>();

//-----------------------------------------------------------------------------------------------//
//<summary>
// Reads the saved theme preference from localStorage, falling back to the default.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // localStorage can be blocked (private mode); fall through to the default.
  }
  return DEFAULT_THEME;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Subscribes to preference changes from this tab (setTheme) and from other tabs (storage event).
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Adds or removes the "dark" class on <html>, resolving "system" via the OS setting.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function applyTheme(theme: Theme): void {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Provides the Light / Dark / System preference and keeps the <html> dark class in sync with it.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);

  // Apply on every change; while on "system", also follow live OS changes.
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Preference just won't persist; the in-memory switch below still applies.
    }
    listeners.forEach((listener) => listener());
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Returns the current theme preference and its setter. Must be used inside ThemeProvider.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Subscribes to OS colour-scheme changes so useIsDark() updates live while on "system".
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function subscribeSystemDark(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Returns true when the app is currently showing dark (explicit "dark", or "system" with a dark OS).
// For values Tailwind classes can't reach, such as recharts colour props.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function useIsDark(): boolean {
  const { theme } = useTheme();
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false
  );
  return theme === "dark" || (theme === "system" && systemDark);
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//