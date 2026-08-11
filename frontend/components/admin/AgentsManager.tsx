// components/admin/AgentsManager.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Power,
  Plus,
  MoreVertical,
  X,
  Eye,
} from "lucide-react";
import {
  Agent,
  listAgents,
  updateAgent,
  createAgent,
  deleteAgent,
} from "@/services/agentsApi";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AgentsManager() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const data = await listAgents();
      setAgents(data);
    } catch {
      setError("Couldn't load agents. You may not have admin access.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  async function handleToggleActive(agent: Agent): Promise<void> {
    await updateAgent(agent.id, { is_active: !agent.is_active });
    load();
  }

  async function handleDelete(agent: Agent): Promise<void> {
    await deleteAgent(agent.id);
    setDeletingAgent(null);
    load();
  }

  const columns: Column<Agent>[] = [
    {
      key: "name",
      header: "Agent",
      cell: (agent: Agent) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold">
            {agent.display_name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              {agent.display_name}
            </span>
            <span className="text-xs text-slate-400">{agent.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (agent: Agent) => (
        <span className="text-sm text-slate-300 max-w-xs truncate block">
          {agent.description}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (agent: Agent) => (
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
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (agent: Agent) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-slate-800 text-slate-400"
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-xl bg-slate-900 border-slate-800"
            >
              <DropdownMenuLabel className="text-slate-400">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => router.push(`/admin/agents/${agent.id}`)}
              >
                <Eye size={14} />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => setEditingAgent(agent)}
              >
                <Pencil size={14} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => handleToggleActive(agent)}
              >
                <Power size={14} />
                {agent.is_active ? "Suspend" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingAgent(agent)}
              >
                <Trash2 size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (error)
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error}
      </div>
    );

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3 p-3 sm:p-4 md:p-5">
      <Table<Agent>
        title="Agents"
        description={
          loading ? "Loading agents..." : `Managing ${agents.length} AI agents.`
        }
        headerAction={
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
          >
            <Plus size={14} />
            New Agent
          </Button>
        }
        loading={loading}
        columns={columns}
        data={agents}
        keyExtractor={(agent: Agent) => agent.id}
        emptyMessage="No agents found. Create your first agent to get started."
      />

      {editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSaved={() => {
            setEditingAgent(null);
            load();
          }}
        />
      )}

      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {deletingAgent && (
        <DeleteModal
          onClose={() => setDeletingAgent(null)}
          onConfirm={() => handleDelete(deletingAgent)}
          title={`Delete ${deletingAgent.display_name}`}
          message={`Are you sure you want to permanently delete "${deletingAgent.display_name}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
}

function EditAgentModal({
  agent,
  onClose,
  onSaved,
}: {
  agent: Agent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [prompt, setPrompt] = useState<string>(agent.system_prompt);
  const [description, setDescription] = useState<string>(agent.description);
  const [saving, setSaving] = useState<boolean>(false);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      await updateAgent(agent.id, { system_prompt: prompt, description });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={`Edit ${agent.display_name}`}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Description (for routing)
          </label>
          <input
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDescription(e.target.value)
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            System Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setPrompt(e.target.value)
            }
            rows={8}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CreateAgentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    description: "",
    system_prompt: "",
  });
  const [saving, setSaving] = useState<boolean>(false);

  async function handleCreate(): Promise<void> {
    setSaving(true);
    try {
      if (!form.name.trim() || !form.display_name.trim()) {
        alert("Name and Display Name are required");
        setSaving(false);
        return;
      }
      await createAgent(form);
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="New Agent">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Name (slug)
          </label>
          <input
            placeholder="e.g. billing"
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Display Name
          </label>
          <input
            placeholder="e.g. Billing Agent"
            value={form.display_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, display_name: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Description
          </label>
          <input
            placeholder="When the router should use this agent"
            value={form.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            System Prompt
          </label>
          <textarea
            placeholder="Enter the system prompt for this agent"
            value={form.system_prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setForm({ ...form, system_prompt: e.target.value })
            }
            rows={5}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={saving || !form.name.trim() || !form.display_name.trim()}
            className="bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
          >
            {saving ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DeleteModal({
  onClose,
  onConfirm,
  title,
  message,
}: {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-slate-400 text-sm mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
