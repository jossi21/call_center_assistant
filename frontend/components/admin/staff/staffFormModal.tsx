// components/admin/staff/StaffFormModal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Staff } from "@/services/staffsApi";
import { Button } from "@/components/ui/button";

interface StaffFormModalProps {
  initial?: Staff;
  title: string;
  onClose: () => void;
  onSubmit: (data: {
    phone_number?: string;
    name: string;
    email: string;
    specialty: string;
  }) => Promise<void>;
}

export function StaffFormModal({
  initial,
  title,
  onClose,
  onSubmit,
}: StaffFormModalProps) {
  const [name, setName] = useState(initial?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(initial?.phone_number || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [specialty, setSpecialty] = useState(initial?.specialty || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!initial && !phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!specialty.trim()) {
      setError("Specialty is required.");
      return;
    }

    setSaving(true);
    try {
      if (initial) {
        await onSubmit({ name, email, specialty });
      } else {
        await onSubmit({ phone_number: phoneNumber, name, email, specialty });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {error && <div className="text-sm text-red-400">{error}</div>}

          {!initial && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Phone number (09XXXXXXXX)
              </label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Specialty (e.g. support, sales, hr — matches an agent name)
            </label>
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
