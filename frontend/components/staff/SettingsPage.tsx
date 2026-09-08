"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  MessageSquare,
  ClipboardList,
  Palette,
  Shield,
} from "lucide-react";
import { GeneralSettingsPanel } from "../../components/GeneralSettingsPanel";

type SettingsTab =
  | "general"
  | "notifications"
  | "chat"
  | "case"
  | "appearance"
  | "security";

const TABS: { key: SettingsTab; label: string; icon: typeof SettingsIcon }[] = [
  { key: "general", label: "General", icon: SettingsIcon },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "chat", label: "Chat Settings", icon: MessageSquare },
  { key: "case", label: "Case Settings", icon: ClipboardList },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "security", label: "Security", icon: Shield },
];

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("general");

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <SettingsIcon size={16} className="text-emerald-400" />
        <h1 className="text-sm font-semibold text-white">Settings</h1>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-6">
        {/* Left nav */}
        <div className="border border-slate-800 rounded-2xl p-2 flex flex-col gap-1 h-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition ${
                tab === t.key
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Right panel */}
        <div className="border border-slate-800 rounded-2xl p-6">
          {tab === "general" && <GeneralSettingsPanel />}
          {tab !== "general" && (
            <div className="text-sm text-slate-500">
              {TABS.find((t) => t.key === tab)?.label} settings aren&apos;t
              available yet — coming in a future update.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
