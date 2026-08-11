"use client";

import { X } from "lucide-react";

export function Modal({
  children,
  title,
  onClose,
  maxWidth = "max-w-lg",
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${maxWidth} p-6 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
