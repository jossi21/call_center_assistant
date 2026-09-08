"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { MyProfile, updateMyProfile } from "@/services/staffProfileApi";

export function EditProfileCard({
  profile,
  onClose,
  onSaved,
}: {
  profile: MyProfile;
  onClose: () => void;
  onSaved: (updated: MyProfile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [specialty, setSpecialty] = useState(profile.specialty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMyProfile({ name, email, specialty });
      onSaved(updated);
      onClose();
    } catch {
      setError("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-sm bg-slate-900 ring-slate-800 text-slate-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Edit Profile</CardTitle>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Specialty
            </label>
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </CardContent>

        <CardFooter className="bg-transparent border-t border-slate-800 justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-xs text-slate-400 hover:text-white border border-slate-800 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim() || !email.trim()}
            className="bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-emerald-600 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
