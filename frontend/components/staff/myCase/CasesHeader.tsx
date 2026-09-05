"use client";

import { Menu } from "lucide-react";
import { MyCase, MyProfile } from "@/services/staffProfileApi";
import { AvailabilityToggle } from "../AvailabilityToggle";
import { NotificationBell } from "./NotificationBell";

export function CasesHeader({
  unresolvedCases,
  onSelectCase,
  profile,
  onProfileUpdated,
  onOpenCaseList,
}: {
  unresolvedCases: MyCase[];
  onSelectCase: (id: string) => void;
  profile: MyProfile | null;
  onProfileUpdated: (p: MyProfile) => void;
  onOpenCaseList: () => void;
}) {
  return (
    <div className="border-b border-slate-800 bg-slate-950 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenCaseList}
          className="text-slate-400 hover:text-white transition lg:hidden"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-sm font-semibold text-white">My Cases</h1>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell
          unresolvedCases={unresolvedCases}
          onSelectCase={onSelectCase}
        />
        {profile && (
          <AvailabilityToggle profile={profile} onUpdated={onProfileUpdated} />
        )}
      </div>
    </div>
  );
}
