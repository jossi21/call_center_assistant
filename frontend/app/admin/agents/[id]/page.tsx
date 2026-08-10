"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getAgent,
  updateAgent,
  Agent as AgentType,
} from "@/services/agentsApi";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [agent, setAgent] = useState<AgentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    description: "",
    system_prompt: "",
  });

  useEffect(() => {
    if (!id) return;
    getAgent(id)
      .then((a) => {
        setAgent(a);
        setForm({
          display_name: a.display_name || "",
          description: a.description || "",
          system_prompt: a.system_prompt || "",
        });
      })
      .catch(() => setError("Failed to load agent"));
  }, [id]);

  const loading = !agent && !error;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading agent...</div>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error}
      </div>
    );

  if (!agent)
    return (
      <div className="p-8 text-slate-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        Agent not found
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
          Back to Agents
        </button>

        <div className="flex gap-2">
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
                    const updated = await updateAgent(id, {
                      display_name: form.display_name,
                      description: form.description,
                      system_prompt: form.system_prompt,
                    });
                    setAgent(updated);
                    setEditing(false);
                  } catch (e) {
                    alert("Failed to update agent");
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

      {/* Agent Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        {/* Name */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-semibold text-white">
              {editing ? (
                <input
                  value={form.display_name}
                  onChange={(e) =>
                    setForm({ ...form, display_name: e.target.value })
                  }
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                agent.display_name
              )}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500">Slug: {agent.name}</span>
              <span
                className={`
                  inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
                  ${
                    agent.is_active
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
                  }
                `}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    agent.is_active ? "bg-emerald-500" : "bg-slate-500"
                  }`}
                />
                {agent.is_active ? "Active" : "Inactive"}
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
            <p className="text-sm text-slate-300">{agent.description}</p>
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

        {/* System Prompt */}
        <div className="pt-4">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            System Prompt
          </h2>
          {!editing ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono">
              {agent.system_prompt}
            </pre>
          ) : (
            <textarea
              value={form.system_prompt}
              onChange={(e) =>
                setForm({ ...form, system_prompt: e.target.value })
              }
              rows={10}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}
