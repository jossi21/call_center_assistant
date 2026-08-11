// components/admin/staff/DeleteStaffModal.tsx
"use client";

import { Staff } from "@/services/staffsApi";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DeleteStaffModalProps {
  staff: Staff;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteStaffModal({
  staff,
  onClose,
  onConfirm,
}: DeleteStaffModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Delete {staff.name}?</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Are you sure you want to permanently delete &ldquo;{staff.name}
          &rdquo;? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
