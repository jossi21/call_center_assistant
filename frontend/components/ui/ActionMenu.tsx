// components/ui/ActionMenu.tsx
"use client";

import { ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

export function ActionMenu({ actions, trigger }: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-muted/50"
        >
          {trigger || (
            <MoreVertical size={16} className="text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            className={`cursor-pointer gap-2 rounded-lg text-xs font-medium ${
              action.color || "text-foreground"
            } ${action.hoverColor || "hover:bg-muted/50"}`}
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
