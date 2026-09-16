"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUp,
  ArrowDown,
  Users,
  MessageSquare,
  Mail,
  Bot,
  UserCheck,
  Zap,
  MessageCircle,
  Wrench,
  FolderOpen,
} from "lucide-react";
import { getAdminDashboard, AdminDashboardData } from "@/services/analyticsApi";

const OUTCOME_COLORS: Record<string, string> = {
  ai_resolved: "#10b981",
  human_handoff: "#a855f7",
  pending: "#f59e0b",
  closed: "#64748b",
};

const OUTCOME_LABELS: Record<string, string> = {
  ai_resolved: "AI Resolved",
  human_handoff: "Human Handoff",
  pending: "Pending",
  closed: "Closed",
};

const STATUS_STYLES: Record<string, string> = {
  waiting_confirmation: "bg-purple-500/10 text-purple-400",
  waiting: "bg-amber-500/10 text-amber-400",
  assigned: "bg-blue-500/10 text-blue-400",
  resolved: "bg-emerald-500/10 text-emerald-400",
  cancelled: "bg-slate-800 text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  waiting_confirmation: "Waiting",
  waiting: "Pending",
  assigned: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

function formatDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function DeltaBadge({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
        positive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(pct)}%
    </span>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  deltaPct,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  deltaPct: number;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div
          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}
        >
          <Icon size={14} className={iconColor} />
        </div>
        <span className="text-[11px] text-slate-400 truncate">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-lg font-bold text-white">{value}</span>
        <DeltaBadge pct={deltaPct} />
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(() =>
    formatDateInput(new Date(Date.now() - 6 * 86400000)),
  );
  const [dateTo, setDateTo] = useState(() => formatDateInput(new Date()));

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await getAdminDashboard(dateFrom, dateTo));
    } catch {
      setError("Couldn't load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error || "No data"}
      </div>
    );
  }

  const outcomeData = [
    { key: "ai_resolved", value: data.outcome.ai_resolved },
    { key: "human_handoff", value: data.outcome.human_handoff },
    { key: "pending", value: data.outcome.pending },
    { key: "closed", value: data.outcome.closed },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white">
            Good morning, Admin 👋
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Here&apos;s what&apos;s happening with your AI call center today.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none"
          />
          <span className="text-slate-600">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
        <StatCard
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          label="Total Users"
          value={data.total_users.value.toLocaleString()}
          deltaPct={data.total_users.delta_pct}
        />
        <StatCard
          icon={MessageCircle}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          label="Conversations"
          value={data.total_conversations.value.toLocaleString()}
          deltaPct={data.total_conversations.delta_pct}
        />
        <StatCard
          icon={Mail}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
          label="Messages"
          value={data.total_messages.value.toLocaleString()}
          deltaPct={data.total_messages.delta_pct}
        />
        <StatCard
          icon={Bot}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          label="AI Resolution"
          value={`${data.ai_resolution_rate.value}%`}
          deltaPct={data.ai_resolution_rate.delta_pct}
        />
        <StatCard
          icon={UserCheck}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10"
          label="Human Handoff"
          value={`${data.human_handoff_rate.value}%`}
          deltaPct={data.human_handoff_rate.delta_pct}
        />
        <StatCard
          icon={Zap}
          iconColor="text-teal-400"
          iconBg="bg-teal-500/10"
          label="Avg Response"
          value={`${data.avg_response_seconds.value}s`}
          deltaPct={data.avg_response_seconds.delta_pct}
        />
      </div>

      {/* Charts row */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 shrink-0"
        style={{ height: "220px" }}
      >
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col min-h-0">
          <h2 className="text-xs font-semibold text-white mb-2 shrink-0">
            Conversation Activity
          </h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend}>
                <Legend
                  wrapperStyle={{ fontSize: 10, color: "#94a3b8" }}
                  height={20}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line
                  type="monotone"
                  dataKey="messages"
                  name="Messages"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="conversations"
                  name="Conversations"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="human_handoff"
                  name="Human Handoff"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col min-h-0">
          <h2 className="text-xs font-semibold text-white mb-2 shrink-0">
            Conversation Outcome
          </h2>
          <div className="flex-1 flex items-center gap-3 min-h-0">
            <div className="h-24 w-24 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    dataKey="value"
                    nameKey="key"
                    innerRadius={30}
                    outerRadius={44}
                    paddingAngle={2}
                  >
                    {outcomeData.map((entry) => (
                      <Cell key={entry.key} fill={OUTCOME_COLORS[entry.key]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-bold text-white">
                  {data.outcome.total}
                </span>
                <span className="text-[9px] text-slate-400">Total</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              {outcomeData.map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="flex items-center gap-1.5 text-slate-300 truncate">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: OUTCOME_COLORS[entry.key] }}
                    />
                    {OUTCOME_LABELS[entry.key]}
                  </span>
                  <span className="text-slate-500 shrink-0">
                    {data.outcome.total > 0
                      ? Math.round((entry.value / data.outcome.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row — 4 panels, fills remaining space */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col min-h-0">
          <h2 className="text-xs font-semibold text-white mb-2 shrink-0">
            Top Agents
          </h2>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
            {data.top_agents.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No data for this period.
              </p>
            ) : (
              data.top_agents.map((a) => (
                <div key={a.agent}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-200 capitalize truncate">
                      {a.agent}
                    </span>
                    <span className="text-slate-500 shrink-0">{a.pct}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col min-h-0">
          <h2 className="text-xs font-semibold text-white mb-2 shrink-0">
            Most Used Tools
          </h2>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
            {data.top_tools.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No data for this period.
              </p>
            ) : (
              data.top_tools.map((t) => (
                <div key={t.tool}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-200 flex items-center gap-1 truncate">
                      <Wrench size={10} className="text-slate-500 shrink-0" />
                      {t.tool}
                    </span>
                    <span className="text-slate-500 shrink-0">{t.pct}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col min-h-0">
          <h2 className="text-xs font-semibold text-white mb-2 shrink-0">
            Recent Activity
          </h2>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
            {data.recent_activity.length === 0 ? (
              <p className="text-[11px] text-slate-500">Nothing recent.</p>
            ) : (
              data.recent_activity.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <div className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare size={10} className="text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 truncate">{item.detail}</p>
                    <p className="text-slate-500 text-[10px]">
                      {timeAgo(item.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col min-h-0">
          <h2 className="text-xs font-semibold text-white mb-2 shrink-0">
            Recent Cases
          </h2>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
            {data.recent_cases.length === 0 ? (
              <p className="text-[11px] text-slate-500">No cases yet.</p>
            ) : (
              data.recent_cases.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-[11px]">
                  <div className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FolderOpen size={10} className="text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 truncate">{c.reason}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${STATUS_STYLES[c.status] ?? "bg-slate-800 text-slate-400"}`}
                      >
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      <span className="text-slate-500 text-[10px] truncate">
                        {c.assigned_to}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
