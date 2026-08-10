// app/admin/tools/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Save, X, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tool,
  getTool,
  updateTool,
  toggleToolActive,
} from "@/services/toolsApi";

export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    risk_tier: "safe" as Tool["risk_tier"],
    action_type: "call_webhook" as Tool["action_type"],
  });

  useEffect(() => {
    if (!id) return;
    getTool(id)
      .then((t) => {
        setTool(t);
        setForm({
          name: t.name || "",
          description: t.description || "",
          risk_tier: t.risk_tier || "safe",
          action_type: t.action_type || "call_webhook",
        });
      })
      .catch(() => setError("Failed to load tool"));
  }, [id]);

  async function handleToggleActive() {
    if (!tool) return;
    await toggleToolActive(tool.id);
    const updated = await getTool(id);
    setTool(updated);
  }

  const loading = !tool && !error;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading tool...</div>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error}
      </div>
    );

  if (!tool)
    return (
      <div className="p-8 text-slate-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        Tool not found
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Back to Tools
        </button>

        <div className="flex gap-2">
          <Button
            onClick={handleToggleActive}
            className={`gap-2 ${
              tool.is_active
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            } cursor-pointer`}
          >
            <Power size={14} />
            {tool.is_active ? "Deactivate" : "Activate"}
          </Button>

          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              className="gap-2 bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
            >
              <Pencil size={14} />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <X size={14} className="mr-1" />
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const updated = await updateTool(id, {
                      description: form.description,
                      risk_tier: form.risk_tier,
                      action_type: form.action_type,
                    });
                    setTool(updated);
                    setEditing(false);
                  } catch (e) {
                    alert("Failed to update tool");
                  }
                }}
                className="gap-2 bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
              >
                <Save size={14} />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tool Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        {/* Name */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-semibold text-white">{tool.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500">
                ID: {tool.id.slice(0, 8)}...
              </span>
              <span
                className={`
                  inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
                  ${
                    tool.is_active
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
                  }
                `}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    tool.is_active ? "bg-emerald-500" : "bg-slate-500"
                  }`}
                />
                {tool.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-4 pb-3 border-b border-slate-800">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Description
          </h2>
          {!editing ? (
            <p className="text-sm text-slate-300">{tool.description}</p>
          ) : (
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}
        </div>

        {/* Agent */}
        <div className="py-3 border-b border-slate-800">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Agent
          </h2>
          <p className="text-sm text-slate-300">
            {tool.agent_name || "All agents"}
          </p>
        </div>

        {/* Risk Tier */}
        <div className="py-3 border-b border-slate-800">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Risk Tier
          </h2>
          {!editing ? (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                tool.risk_tier === "safe"
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                  : tool.risk_tier === "reversible"
                    ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                    : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
              }`}
            >
              {tool.risk_tier}
            </span>
          ) : (
            <select
              value={form.risk_tier}
              onChange={(e) =>
                setForm({
                  ...form,
                  risk_tier: e.target.value as Tool["risk_tier"],
                })
              }
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="safe">Safe</option>
              <option value="reversible">Reversible</option>
              <option value="destructive">Destructive</option>
            </select>
          )}
        </div>

        {/* Action Type */}
        <div className="py-3 border-b border-slate-800">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Action Type
          </h2>
          {!editing ? (
            <p className="text-sm text-slate-300 capitalize">
              {tool.action_type.replace(/_/g, " ")}
            </p>
          ) : (
            <select
              value={form.action_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  action_type: e.target.value as Tool["action_type"],
                })
              }
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="call_webhook">Call Webhook</option>
              <option value="update_user_field">Update User Field</option>
              <option value="write_user_memory">Write User Memory</option>
            </select>
          )}
        </div>

        {/* Parameters Schema */}
        <div className="pt-4">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Parameters Schema
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono">
            {JSON.stringify(tool.parameters_schema, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
