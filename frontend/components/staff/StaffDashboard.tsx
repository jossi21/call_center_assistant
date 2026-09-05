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
import { FileText } from "lucide-react";
import {
  getMyProfile,
  listMyCases,
  getDashboardStats,
  MyProfile,
  MyCase,
  DashboardStats,
} from "@/services/staffProfileApi";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { StatCardsRow } from "./StatCard";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  resolved: "#10b981",
  waiting_confirmation: "#a855f7",
};

function formatSeconds(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
}

export function StaffDashboard() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [cases, setCases] = useState<MyCase[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<"week" | "month">("week");
  const [perfPeriod, setPerfPeriod] = useState(
    "today" as "today" | "week" | "month" | "all",
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [profileData, casesData, statsData] = await Promise.all([
        getMyProfile(),
        listMyCases(),
        getDashboardStats(chartRange, perfPeriod),
      ]);
      setProfile(profileData);
      setCases(casesData);
      setStats(statsData);
    } catch {
      setError(
        "Couldn't load your dashboard. You may not be registered as staff.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRange, perfPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !profile || !stats) {
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error || "Dashboard data not found"}
      </div>
    );
  }

  const recentCases = [...cases]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  const pieData = [
    {
      name: "Pending",
      value: stats.status_distribution.pending,
      key: "pending",
    },
    {
      name: "In Progress",
      value: stats.status_distribution.in_progress,
      key: "in_progress",
    },
    {
      name: "Resolved",
      value: stats.status_distribution.resolved,
      key: "resolved",
    },
    {
      name: "Waiting Confirmation",
      value: stats.status_distribution.waiting_confirmation,
      key: "waiting_confirmation",
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-screen flex flex-col p-3 sm:p-4 md:p-5 gap-4 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {profile.specialty} specialist
          </p>
        </div>
        <AvailabilityToggle profile={profile} onUpdated={setProfile} />
      </div>

      {/* Stat cards */}
      <div className="shrink-0">
        <StatCardsRow
          activeCases={stats.active_cases}
          pending={stats.pending}
          inProgress={stats.in_progress}
          resolvedToday={stats.resolved_today}
          avgResponseSeconds={stats.avg_response_seconds}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
        {/* Cases Over Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-sm font-semibold text-white">
              Cases Over Time
            </h2>
            <select
              value={chartRange}
              onChange={(e) =>
                setChartRange(e.target.value as "week" | "month")
              }
              className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.cases_over_time}>
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Created"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-white mb-4 shrink-0">
            Case Status Distribution
          </h2>
          <div className="flex-1 flex items-center gap-6 min-h-0">
            <div className="h-44 w-44 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white">
                  {stats.total_cases}
                </span>
                <span className="text-xs text-slate-400">Total Cases</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {pieData.map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[entry.key] }}
                  />
                  <span className="text-slate-300">{entry.name}</span>
                  <span className="text-slate-500">
                    (
                    {stats.total_cases > 0
                      ? Math.round((entry.value / stats.total_cases) * 100)
                      : 0}
                    %, {entry.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-5 shrink-0">
        {/* Recent Cases */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Cases</h2>
            <Link
              href="/staff/cases"
              className="text-xs text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentCases.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                No cases yet.
              </p>
            ) : (
              recentCases.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{c.reason}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(c.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Your Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              Your Performance
            </h2>
            <select
              value={perfPeriod}
              onChange={(e) =>
                setPerfPeriod(
                  e.target.value as "today" | "week" | "month" | "all",
                )
              }
              className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">
                {stats.performance.resolved}
              </p>
              <p className="text-xs text-slate-400">Resolved</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">
                {stats.performance.messages_sent}
              </p>
              <p className="text-xs text-slate-400">Messages Sent</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-400">
                {stats.performance.resolution_rate}%
              </p>
              <p className="text-xs text-slate-400">Resolution Rate</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">
                {formatSeconds(stats.performance.avg_response_seconds)}
              </p>
              <p className="text-xs text-slate-400">Avg Response Time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    waiting: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
    assigned: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
    resolved: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
    waiting_confirmation:
      "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
  };
  const labelMap: Record<string, string> = {
    waiting: "Pending",
    assigned: "In Progress",
    resolved: "Resolved",
    waiting_confirmation: "Waiting Confirmation",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colorMap[status] || "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
      }`}
    >
      {labelMap[status] || status}
    </span>
  );
}
