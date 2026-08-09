"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getAgent,
  updateAgent,
  Agent as AgentType,
} from "@/services/agentsApi";
import { Button } from "@/components/ui/button";

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
    // Fetch agent and initialize form when the data arrives. Avoid synchronous setState in the effect body.
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!agent) return <div className="p-6">Agent not found</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{agent.display_name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          {!editing && <Button onClick={() => setEditing(true)}>Edit</Button>}
        </div>
      </div>

      <div className="bg-card rounded-lg p-4">
        <div className="mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">Slug</h2>
          <div className="text-sm text-foreground">{agent.name}</div>
        </div>

        <div className="mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Description
          </h2>
          {!editing ? (
            <div className="text-sm text-foreground">{agent.description}</div>
          ) : (
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        <div className="mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">Status</h2>
          <div className="text-sm text-foreground">
            {agent.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            System Prompt
          </h2>
          {!editing ? (
            <pre className="whitespace-pre-wrap text-sm text-foreground bg-background p-3 rounded mt-1">
              {agent.system_prompt}
            </pre>
          ) : (
            <textarea
              value={form.system_prompt}
              onChange={(e) =>
                setForm({ ...form, system_prompt: e.target.value })
              }
              rows={8}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {editing && (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-400 hover:bg-green-500 cursor-pointer text-primary-foreground"
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
            >
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
