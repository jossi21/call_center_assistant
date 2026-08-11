"use client";

import { useEffect, useState } from "react";
import { Users, MessageSquare, Zap, Bot } from "lucide-react";
import { Analytics, getAnalytics } from "@/services/analyticsApi";
import { ActivityChart } from "../admin/Analytics/ActivityChart";
import { DailyStat, getTimeseries } from "@/services/analyticsApi";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
      <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
        <Icon size={20} className="text-emerald-400" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-300 w-32 truncate">{label}</span>
      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeseries, setTimeseries] = useState<DailyStat[]>([]);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const [analyticsData, tsData] = await Promise.all([
          getAnalytics(),
          getTimeseries(),
        ]);
        setData(analyticsData);
        setTimeseries(tsData);
      } catch {
        setError("Couldn't load analytics.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading)
    return (
      <div className="p-8 text-slate-400 text-sm">Loading analytics...</div>
    );
  if (error || !data)
    return <div className="p-8 text-red-400 text-sm">{error}</div>;

  const maxAgent = Math.max(1, ...data.agent_usage.map((a) => a.count));
  const maxTool = Math.max(1, ...data.tool_usage.map((t) => t.count));

  return (
    <div className="mx-auto max-w-6xl p-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={data.total_users} />
        <StatCard
          icon={MessageSquare}
          label="Total Messages"
          value={data.total_messages}
        />
        <StatCard
          icon={Bot}
          label="Agents Used"
          value={data.agent_usage.length}
        />
        <StatCard
          icon={Zap}
          label="Avg Response Time"
          value={
            data.avg_response_time_ms
              ? `${(data.avg_response_time_ms / 1000).toFixed(1)}s`
              : "—"
          }
        />
      </div>
      <ActivityChart data={timeseries} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Most Requested Agents
          </h2>
          <div className="flex flex-col gap-3">
            {data.agent_usage.length === 0 ? (
              <span className="text-xs text-slate-500">No data yet.</span>
            ) : (
              data.agent_usage.map((a) => (
                <UsageBar
                  key={a.agent}
                  label={a.agent}
                  count={a.count}
                  max={maxAgent}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Most Used Tools
          </h2>
          <div className="flex flex-col gap-3">
            {data.tool_usage.length === 0 ? (
              <span className="text-xs text-slate-500">No data yet.</span>
            ) : (
              data.tool_usage.map((t) => (
                <UsageBar
                  key={t.tool}
                  label={t.tool}
                  count={t.count}
                  max={maxTool}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
