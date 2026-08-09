// components/ui/ActionMenu.tsx
"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      // Get the button position
      const rect = buttonRef.current.getBoundingClientRect();

      // Get the menu element and its actual height
      const menuElement = menuRef.current;
      const menuWidth = 160;
      const menuHeight = menuElement ? menuElement.offsetHeight : 200;

      // Center vertically relative to the button
      let top = rect.top + rect.height / 2 - menuHeight / 2;
      // Position to the left with 10px gap
      let left = rect.left - menuWidth - 10;

      // Check if menu goes below viewport
      if (top + menuHeight > window.innerHeight - 10) {
        top = window.innerHeight - menuHeight - 10;
      }

      // Check if menu goes above viewport
      if (top < 10) {
        top = 10;
      }

      // Check if menu goes left of viewport
      if (left < 10) {
        left = rect.right + 10;
      }

      setMenuPosition({ top, left });
    }
  }, [isOpen, actions]);

  const toggleMenu = (): void => setIsOpen(!isOpen);
  const closeMenu = (): void => setIsOpen(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          toggleMenu();
        }}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        type="button"
      >
        {trigger || <MoreVertical size={18} />}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-9999 min-w-40 bg-white rounded-xl border border-zinc-200/60 shadow-lg py-1.5"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
}
