"use client";

import { useEffect, useState } from "react";
import { Headset, Pencil } from "lucide-react";
import { MyProfile, getMyProfile } from "@/services/staffProfileApi";
import { EditProfileCard } from "./EditProfileCard";

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch {
        setError("Couldn't load profile.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading)
    return <div className="p-8 text-slate-400 text-sm">Loading profile...</div>;
  if (error || !profile)
    return <div className="p-8 text-red-400 text-sm">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Headset size={16} className="text-emerald-400" />
        <h1 className="text-sm font-semibold text-white">Profile</h1>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-6">
        <div className="border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-700 flex items-center justify-center text-2xl font-bold text-white mb-4">
            {getInitials(profile.name)}
          </div>
          <div className="text-base font-semibold text-white">
            {profile.name}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {profile.specialty} Specialist
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {profile.status === "available" ? "Available" : profile.status}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition"
          >
            <Pencil size={12} />
            Edit Profile
          </button>
        </div>

        <div className="border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Profile Information
          </h2>
          <dl className="flex flex-col divide-y divide-slate-800">
            <InfoRow label="Full Name" value={profile.name} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Phone" value={profile.phone ?? "—"} />
            <InfoRow label="Role" value={`${profile.specialty} Specialist`} />
            <InfoRow
              label="Member Since"
              value={new Date(profile.member_since).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                },
              )}
            />
          </dl>
        </div>
      </div>

      {editing && (
        <EditProfileCard
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
