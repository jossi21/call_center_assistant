"use client";

import { useState } from "react";
import { MyProfile, updateMyAvailability } from "@/services/staffProfileApi";

export function AvailabilityToggle({
  profile,
  onUpdated,
}: {
  profile: MyProfile;
  onUpdated: (profile: MyProfile) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    try {
      const updated = await updateMyAvailability(!profile.is_available);
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={saving}
      className={`
        flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50
        ${
          profile.is_available
            ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20"
            : "bg-orange-400 text-white ring-1 ring-slate-700 hover:bg-orange-500"
        }
      `}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          profile.is_available ? "bg-emerald-500" : "bg-orange-600"
        }`}
      />
      {profile.is_available ? "Available" : "Unavailable"}
    </button>
  );
}
