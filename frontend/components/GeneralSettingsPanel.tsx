"use client";

import { useEffect, useState } from "react";
import {
  getMySettings,
  updateMySettings,
  StaffSettings,
} from "@/services/staffProfileApi";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "am", label: "Amharic" },
];

// NOTE: a short illustrative subset, not an exhaustive IANA timezone list
const TIMEZONES = [
  { value: "UTC", label: "(UTC+00:00) UTC" },
  { value: "Africa/Lagos", label: "(GMT+01:00) West Africa Time" },
  { value: "Africa/Nairobi", label: "(GMT+03:00) East Africa Time" },
  { value: "Europe/London", label: "(GMT+00:00) London" },
  { value: "America/New_York", label: "(GMT-05:00) New York" },
];

export function GeneralSettingsPanel() {
  const [settings, setSettings] = useState<StaffSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const data = await getMySettings();
        setSettings(data);
      } catch {
        setError("Couldn't load settings.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateMySettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Couldn't save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <div className="text-sm text-slate-400">Loading settings...</div>;
  if (error && !settings)
    return <div className="text-sm text-red-400">{error}</div>;
  if (!settings) return null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-sm font-semibold text-white">General Settings</h2>

      <div className="grid grid-cols-2 gap-6 max-w-lg">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) =>
              setSettings({ ...settings, language: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Time Zone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) =>
              setSettings({ ...settings, timezone: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ToggleRow
        label="Auto-assign new cases"
        checked={settings.auto_assign_cases}
        onChange={(v) => setSettings({ ...settings, auto_assign_cases: v })}
      />

      <ToggleRow
        label="Play sound for new messages"
        checked={settings.play_sound_on_new_message}
        onChange={(v) =>
          setSettings({ ...settings, play_sound_on_new_message: v })
        }
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50 w-fit"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && <span className="text-xs text-emerald-400">Saved.</span>}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between max-w-lg">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
