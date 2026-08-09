"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Staff } from "@/services/staffsApi";

export function StaffFormModal({
  initial,
  title,
  onClose,
  onSubmit,
}: {
  initial?: Staff;
  title: string;
  onClose: () => void;
  onSubmit: (data: {
    phone_number?: string;
    name: string;
    email: string;
    specialty: string;
  }) => Promise<void>;
}) {
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
    <Modal onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col gap-3">
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!initial && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Phone number (09XXXXXXXX)
            </label>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Specialty (e.g. support, sales, hr — matches an agent name)
          </label>
          <input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-400 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 hover:bg-green-500 transition"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
