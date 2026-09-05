"use client";

import {
  FolderOpen,
  Clock,
  Loader2 as LoaderIcon,
  CheckCircle2,
  Zap,
} from "lucide-react";

function formatSeconds(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
}

export function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        <Icon size={18} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-slate-500 truncate">{label}</p>
      </div>
    </div>
  );
}

export function StatCardsRow({
  activeCases,
  pending,
  inProgress,
  resolvedToday,
  avgResponseSeconds,
  className = "grid grid-cols-5 gap-4",
}: {
  activeCases: number;
  pending: number;
  inProgress: number;
  resolvedToday: number;
  avgResponseSeconds: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <StatCard
        icon={FolderOpen}
        iconColor="text-blue-400"
        iconBg="bg-blue-500/10"
        label="My Active Cases"
        value={activeCases}
      />
      <StatCard
        icon={Clock}
        iconColor="text-amber-400"
        iconBg="bg-amber-500/10"
        label="Pending"
        value={pending}
      />
      <StatCard
        icon={LoaderIcon}
        iconColor="text-indigo-400"
        iconBg="bg-indigo-500/10"
        label="In Progress"
        value={inProgress}
      />
      <StatCard
        icon={CheckCircle2}
        iconColor="text-emerald-400"
        iconBg="bg-emerald-500/10"
        label="Resolved Today"
        value={resolvedToday}
      />
      <StatCard
        icon={Zap}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-500/10"
        label="Avg Response Time"
        value={formatSeconds(avgResponseSeconds)}
      />
    </div>
  );
}
