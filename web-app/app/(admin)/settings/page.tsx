"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { getInitials, getRoleLabel } from "../../lib/user-display";

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
    <div className="bg-slate-100/80 p-6 min-h-screen rounded-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Configure the ConservaTech admin portal</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <nav className="bg-white rounded-2xl border border-slate-200 p-3 w-full md:w-64 shrink-0 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                tab === t.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 p-6">
          {tab === "profile" ? <ProfileTab /> : <SystemPreferencesTab />}
        </div>
      </div>
    </div>
  );
}

// ---- Administrator Profile tab ----

function ProfileTab() {
  const { user, role } = useAuth();

  // The token only carries one "name" claim, so first/last are a best-effort
  // split: first word = first name, the rest = last name.
  const fullName = (user?.name ?? "").trim();
  const parts = fullName ? fullName.split(/\s+/) : [];
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Administrator Profile</h2>

      <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
        <div className="w-16 h-16 rounded-xl bg-blue-700 text-white flex items-center justify-center text-xl font-semibold">
          {getInitials(user)}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{fullName || "Name not available"}</p>
          <p className="text-sm text-slate-500">{getRoleLabel(role)} · SANCCOB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReadOnlyField id="profile-first-name" label="First Name" value={firstName} />
        <ReadOnlyField id="profile-last-name" label="Last Name" value={lastName} />
        <ReadOnlyField id="profile-email" label="Email Address" value={user?.email ?? ""} />
        <ReadOnlyField id="profile-role" label="Role" value={getRoleLabel(role)} />
      </div>

      {/* Not-yet-supported note, matching the Trainers page convention */}
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Profile details are read from your login and can&apos;t be edited yet. Phone number, job
        title, department and profile photo aren&apos;t stored by the backend, so they are not shown here.
      </p>
    </div>
  );
}

function ReadOnlyField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        readOnly
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
      />
    </div>
  );
}

// ---- System Preferences tab ----

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
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <form onSubmit={handleSave} className="space-y-2">
      <h2 className="text-lg font-bold text-slate-900 mb-2">System Preferences</h2>

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

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
        These preferences are saved in this browser only. They aren&apos;t shared with other devices,
        other admins or the mobile app, and they don&apos;t change how dates are shown on other pages yet.
      </p>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        {justSaved && <span className="text-sm text-green-700">Saved</span>}
      </div>
    </form>
  );
}

function PrefRow({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      {children}
    </div>
  );
}

//-----------------------------0-0-0--End Of File--0-0-0-----------------------------------------------------//