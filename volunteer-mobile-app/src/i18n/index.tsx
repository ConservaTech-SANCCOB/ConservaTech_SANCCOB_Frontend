import * as SecureStore from "expo-secure-store";
import { I18n } from "i18n-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import af from "./locales/af.json";
import en from "./locales/en.json";
import xh from "./locales/xh.json";
import zu from "./locales/zu.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "af", label: "Afrikaans", nativeLabel: "Afrikaans" },
  { code: "xh", label: "isiXhosa", nativeLabel: "isiXhosa" },
  { code: "zu", label: "isiZulu", nativeLabel: "isiZulu" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const STORAGE_KEY = "conservatech_language";

// Single i18n instance — translations are merged from all four JSON files and
// English is the fallback for any missing key so a half-translated screen never
// shows a raw key like "profile.title".
const i18n = new I18n({ en, af, xh, zu });
i18n.enableFallback = true;
i18n.defaultLocale = "en";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  t: (key: string, options?: object) => string;
  isReady: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

//-----------------------------------------------------------------------------------------------//
// Resolves the initial language from (1) a previously saved choice or (2) the device locale,
// falling back to English for any locale we don't support.
//-----------------------------------------------------------------------------------------------//
async function resolveInitialLanguage(): Promise<LanguageCode> {
  try {
    const saved = await SecureStore.getItemAsync(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved as LanguageCode;
    }
  } catch {
    // Storage unavailable — fall through to device language.
  }
  // e.g. "af-ZA" -> "af"; Intl is built into Hermes, no native module needed
  const deviceCode = (
    Intl.DateTimeFormat().resolvedOptions().locale ?? "en"
  ).split("-")[0];
  return (
    SUPPORTED_LANGUAGES.some((l) => l.code === deviceCode) ? deviceCode : "en"
  ) as LanguageCode;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [isReady, setIsReady] = useState(false);

  // Load the user's saved language (or detect from device) on mount.
  useEffect(() => {
    resolveInitialLanguage().then((code) => {
      i18n.locale = code;
      setLanguageState(code);
      setIsReady(true);
    });
  }, []);

  const setLanguage = async (code: LanguageCode) => {
    i18n.locale = code;
    setLanguageState(code);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, code);
    } catch {
      // Non-fatal — the switch still applies this session.
    }
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, options) => i18n.t(key, options),
      isReady,
    }),
    [language, isReady],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Fallback used when a component renders outside LanguageProvider (unit tests, or a screen
// mounted before the provider). It reads English and ignores language switches, so nothing
// crashes.
const FALLBACK: LanguageContextValue = {
  language: "en",
  setLanguage: async () => {},
  t: (key, options) => i18n.t(key, { locale: "en", ...options }),
  isReady: true,
};

export function useLanguage() {
  return useContext(LanguageContext) ?? FALLBACK;
}
