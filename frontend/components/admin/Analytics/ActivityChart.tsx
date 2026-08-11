"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DailyStat } from "@/services/analyticsApi";

type ViewMode = "daily" | "weekly" | "monthly";

function aggregate(data: DailyStat[], mode: ViewMode) {
  if (mode === "daily") return data;

  const buckets = new Map<string, { date: string; messages: number; new_users: number }>();

  for (const d of data) {
    const date = new Date(d.date);
    let key: string;

    if (mode === "weekly") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().slice(0, 10);
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    const existing = buckets.get(key);
    if (existing) {
      existing.messages += d.messages;
      existing.new_users += d.new_users;
    } else {
      buckets.set(key, { date: key, messages: d.messages, new_users: d.new_users });
    }
  }

  return Array.from(buckets.values());
}

export function ActivityChart({ data }: { data: DailyStat[] }) {
  const [mode, setMode] = useState<ViewMode>("daily");
  const chartData = aggregate(data, mode);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Activity Over Time</h2>
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {(["daily", "weekly", "monthly"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs px-3 py-1.5 rounded-md capitalize transition ${
                mode === m ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Line type="monotone" dataKey="messages" stroke="#10b981" strokeWidth={2} name="Messages" dot={false} />
          <Line type="monotone" dataKey="new_users" stroke="#6366f1" strokeWidth={2} name="New Users" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}