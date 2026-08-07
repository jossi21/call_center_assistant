"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

export interface ActionItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  color?: string;
  hoverColor?: string;
  divider?: boolean;
}

interface ActionMenuProps {
  actions: ActionItem[];
  trigger?: ReactNode;
  className?: string;
}

export function ActionMenu({
  actions,
  trigger,
  className = "",
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (): void => setIsOpen(!isOpen);
  const closeMenu = (): void => setIsOpen(false);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMenu();
        }}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        type="button"
      >
        {trigger || <MoreVertical size={18} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-10 min-w-[160px] bg-white rounded-xl border border-zinc-200/60 shadow-lg py-1.5">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                closeMenu();
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${
                action.color || "text-zinc-700"
              } ${action.hoverColor || "hover:bg-zinc-50"}`}
              type="button"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
