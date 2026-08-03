"use client";

import { Action } from "@/types/chat";

export default function ActionButtons({
  actions,
  onAction,
}: {
  actions: Action[];
  onAction: (action: Action) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => onAction(action)}
          className="
            px-4
            py-2
            rounded-full
            border
            border-indigo-400
            text-indigo-500
            text-sm
            hover:bg-indigo-50
            transition
          "
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
