"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { useTheme, type Theme } from "../../lib/theme-context";
import { getInitials, getRoleLabel } from "../../lib/user-display";
import { updateAdminProfile } from "../../lib/api/admin_profile";

type TabId = "profile" | "system";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Administrator Profile" },
  { id: "system", label: "System Preferences" },
];

interface SystemPrefs {
  timezone: string;
  dateFormat: string;
  language: string;
}

const DEFAULT_PREFS: SystemPrefs = {
  timezone: "Africa/Johannesburg",
  dateFormat: "DD/MM/YYYY",
  language: "en-ZA",
};

const TIMEZONES = [
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST, UTC+2)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "Europe/London" },
];
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const LANGUAGES = [{ value: "en-ZA", label: "English (South Africa)" }];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const PREFS_KEY = "admin_system_preferences";

export default function SettingsPage() {
  // useSearchParams needs a Suspense boundary or `npm run build` fails.
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(searchParams.get("tab") === "system" ? "system" : "profile");

  // Follow the topbar menu links (/settings?tab=...) even when already on this page.
  useEffect(() => {
    setTab(searchParams.get("tab") === "system" ? "system" : "profile");
  }, [searchParams]);

  return (
    <div className="bg-slate-100/80 dark:bg-slate-900/40 p-6 min-h-screen rounded-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure the ConservaTech admin portal</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <nav className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 w-full md:w-64 shrink-0 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                tab === t.id
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          {tab === "profile" ? <ProfileTab /> : <SystemPreferencesTab />}
        </div>
      </div>
    </div>
  );
}

// -------------------------------- Administrator Profile tab ---------------------------------//

function ProfileTab() {
  const { user, role, token, updateUser } = useAuth();

  // The token only carries one "name" claim, so first/last are a best-effort
  // split: first word = first name, the rest = last name.
  const fullName = (user?.name ?? "").trim();
  const parts = fullName ? fullName.split(/\s+/) : [];
  const savedFirst = parts[0] ?? "";
  const savedLast = parts.slice(1).join(" ");
  const savedEmail = user?.email ?? "";

  const [firstName, setFirstName] = useState(savedFirst);
  const [lastName, setLastName] = useState(savedLast);
  const [email, setEmail] = useState(savedEmail);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const isDirty =
    firstName.trim() !== savedFirst ||
    lastName.trim() !== savedLast ||
    email.trim() !== savedEmail;

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Saves the admin's name and email via PUT /api/admin/profile, then updates
  // the local auth state so the topbar and this page show the new values.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setJustSaved(false);
    setIsSaving(true);
    try {
      await updateAdminProfile(token, { firstName, lastName, email });
      updateUser?.({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(savedFirst);
    setLastName(savedLast);
    setEmail(savedEmail);
    setError("");
    setJustSaved(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Administrator Profile</h2>

      <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="w-16 h-16 rounded-xl bg-blue-700 text-white flex items-center justify-center text-xl font-semibold">
          {getInitials(user)}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{fullName || "Name not available"}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{getRoleLabel(role)} · SANCCOB</p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <EditableField id="profile-first-name" label="First Name" value={firstName} onChange={setFirstName} maxLength={100} />
        <EditableField id="profile-last-name" label="Last Name" value={lastName} onChange={setLastName} maxLength={100} />
        <EditableField id="profile-email" label="Email Address" value={email} onChange={setEmail} type="email" maxLength={225} />
        <ReadOnlyField id="profile-role" label="Role" value={getRoleLabel(role)} />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="submit"
          disabled={isSaving || !isDirty}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving || !isDirty}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        {justSaved && <span className="text-sm text-green-700 dark:text-green-400">Saved</span>}
      </div>
    </form>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Labelled, editable, required text input used by the profile form.
//</summary>
//-----------------------------------------------------------------------------------------------//
function EditableField({
  id,
  label,
  value,
  onChange,
  type = "text",
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
    </div>
  );
}

function ReadOnlyField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        readOnly
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
      />
    </div>
  );
}

// -----------------------System Preferences tab-------------------------------------------//

function SystemPreferencesTab() {
  const [saved, setSaved] = useState<SystemPrefs>(DEFAULT_PREFS);
  const [draft, setDraft] = useState<SystemPrefs>(DEFAULT_PREFS);
  const [justSaved, setJustSaved] = useState(false);

  // Load after mount (localStorage doesn't exist during server rendering).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const parsed = { ...DEFAULT_PREFS, ...JSON.parse(raw) } as SystemPrefs;
        setSaved(parsed);
        setDraft(parsed);
      }
    } catch {
      // corrupt or unavailable storage -> keep defaults
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(draft));
    } catch {
      // storage unavailable (e.g. private mode) -> still update on-screen state
    }
    setSaved(draft);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleCancel = () => {
    setDraft(saved);
    setJustSaved(false);
  };

  const inputClass =
    "rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <form onSubmit={handleSave} className="space-y-2">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">System Preferences</h2>

      {/*------------------------------------ Theme (applies instantly, not part of Save / Cancel) ----------------------------------------------------*/}
      <PrefRow label="Theme">
        <ThemeSelector />
      </PrefRow>

      <PrefRow htmlFor="pref-timezone" label="Timezone">
        <select
          id="pref-timezone"
          name="timezone"
          value={draft.timezone}
          onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
          className={inputClass}
        >
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </PrefRow>

      <PrefRow htmlFor="pref-date-format" label="Date format">
        <select
          id="pref-date-format"
          name="dateFormat"
          value={draft.dateFormat}
          onChange={(e) => setDraft({ ...draft, dateFormat: e.target.value })}
          className={inputClass}
        >
          {DATE_FORMATS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </PrefRow>

      <PrefRow htmlFor="pref-language" label="Language">
        <select
          id="pref-language"
          name="language"
          value={draft.language}
          onChange={(e) => setDraft({ ...draft, language: e.target.value })}
          className={inputClass}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </PrefRow>

      {/* <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
        These preferences are saved in this browser only. They aren&apos;t shared with other devices,
        other admins or the mobile app, and they don&apos;t change how dates are shown on other pages yet.
      </p> */}

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        {justSaved && <span className="text-sm text-green-700 dark:text-green-400">Saved</span>}
      </div>
    </form>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Light / Dark / System selector. Reads and writes the preference through
// useTheme(), so a click takes effect immediately and is remembered in this
// browser (localStorage key "sanccob-theme").
//</summary>
//-----------------------------------------------------------------------------------------------//
function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5"
    >
      {THEME_OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              active
                ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PrefRow({
  htmlFor,
  label,
  children,
}: {
  htmlFor?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {label}
      </label>
      {children}
    </div>
  );
}

//-----------------------------0-0-0--End Of File--0-0-0-----------------------------------------------------//