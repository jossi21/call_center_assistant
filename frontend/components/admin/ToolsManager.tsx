"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  Power,
  Plus,
  X,
  MoreVertical,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Tool,
  listTools,
  updateTool,
  createTool,
  deleteTool,
} from "@/services/toolsApi";
import { listAgents, createAgent, Agent } from "@/services/agentsApi";
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

const RISK_COLORS: Record<string, string> = {
  safe: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  reversible: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  destructive: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
};

export default function ToolsManager() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingTool, setDeletingTool] = useState<Tool | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const data = await listTools();
      setTools(data);
    } catch {
      setError("Couldn't load tools.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  async function handleToggleActive(tool: Tool): Promise<void> {
    await updateTool(tool.id, { is_active: !tool.is_active });
    load();
  }

  async function handleDelete(tool: Tool): Promise<void> {
    await deleteTool(tool.id);
    setDeletingTool(null);
    load();
  }

  const columns: Column<Tool>[] = [
    {
      key: "name",
      header: "Tool",
      cell: (tool: Tool) => (
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold uppercase">
              {tool.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {tool.name}
              </div>
              <div className="text-xs text-slate-400 truncate max-w-xs">
                {tool.description}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "agent",
      header: "Agent",
      cell: (tool: Tool) => (
        <span className="text-xs text-slate-400">
          {tool.agent_name || "All agents"}
        </span>
      ),
    },
    {
      key: "risk",
      header: "Risk",
      cell: (tool: Tool) => (
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${RISK_COLORS[tool.risk_tier]}`}
        >
          {tool.risk_tier}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (tool: Tool) => (
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
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (tool: Tool) => (
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
                onClick={() => router.push(`/admin/tools/${tool.id}`)}
              >
                <Eye size={14} />
                View
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => setEditingTool(tool)}
              >
                <Pencil size={14} />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => handleToggleActive(tool)}
              >
                <Power size={14} />
                {tool.is_active ? "Suspend" : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingTool(tool)}
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
      <Table<Tool>
        title="Tools"
        description={
          loading ? "Loading tools..." : `Managing ${tools.length} tools.`
        }
        headerAction={
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
          >
            <Plus size={14} />
            New Tool
          </Button>
        }
        loading={loading}
        columns={columns}
        data={tools}
        keyExtractor={(tool: Tool) => tool.id}
        emptyMessage="No tools found. Create your first tool to get started."
      />

      {editingTool && (
        <ToolFormModal
          initial={editingTool}
          title={`Edit ${editingTool.name}`}
          onClose={() => setEditingTool(null)}
          onSubmit={async (data) => {
            await updateTool(editingTool.id, data);
            setEditingTool(null);
            load();
          }}
        />
      )}

      {showCreate && (
        <ToolFormModal
          title="New Tool"
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            await createTool(data as Omit<Tool, "id" | "is_active">);
            setShowCreate(false);
            load();
          }}
        />
      )}

      {deletingTool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-white font-semibold mb-2">Delete this tool?</h2>
            <p className="text-slate-400 text-sm mb-4">
              Are you sure you want to permanently delete &ldquo;
              {deletingTool.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingTool(null)}
                className="text-sm text-slate-400 px-4 py-2 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingTool)}
                className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Shared types for the parameter + config builders ----------

interface ParamRow {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
}

interface JsonSchemaProperty {
  type?: string;
  description?: string;
}

interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface ActionConfig {
  method?: string;
  url?: string;
  field?: string;
  memory_key?: string;
}

function schemaToRows(schema: JsonSchema | undefined): ParamRow[] {
  if (!schema?.properties) return [];
  const required: string[] = schema.required || [];
  return Object.entries(schema.properties).map(([name, def]) => ({
    name,
    type: (def.type as ParamRow["type"]) || "string",
    description: def.description || "",
    required: required.includes(name),
  }));
}

function rowsToSchema(rows: ParamRow[]): JsonSchema {
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];
  for (const row of rows) {
    if (!row.name) continue;
    properties[row.name] = { type: row.type, description: row.description };
    if (row.required) required.push(row.name);
  }
  return { type: "object", properties, required };
}

function configToFields(
  actionType: string,
  config: ActionConfig | undefined,
): ActionConfig {
  config = config || {};
  if (actionType === "call_webhook") {
    return { method: config.method || "POST", url: config.url || "" };
  }
  if (actionType === "update_user_field") {
    return { field: config.field || "" };
  }
  if (actionType === "write_user_memory") {
    return { memory_key: config.memory_key || "" };
  }
  return {};
}

// ---------- Main form modal ----------

function ToolFormModal({
  initial,
  title,
  onClose,
  onSubmit,
}: {
  initial?: Tool;
  title: string;
  onClose: () => void;
  onSubmit: (data: Partial<Tool>) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [riskTier, setRiskTier] = useState<Tool["risk_tier"]>(
    initial?.risk_tier || "safe",
  );
  const [actionType, setActionType] = useState<Tool["action_type"]>(
    initial?.action_type || "call_webhook",
  );

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentName, setAgentName] = useState(initial?.agent_name || "");
  const [showCreateAgent, setShowCreateAgent] = useState(false);

  const [params, setParams] = useState<ParamRow[]>(
    initial ? schemaToRows(initial.parameters_schema as JsonSchema) : [],
  );

  const [webhookMethod, setWebhookMethod] = useState("POST");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [memoryKey, setMemoryKey] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const list = await listAgents();
      setAgents(list.filter((a) => a.is_active));
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const fields = configToFields(
        actionType,
        initial?.action_config as ActionConfig,
      );
      setWebhookMethod(fields.method || "POST");
      setWebhookUrl(fields.url || "");
      setFieldName(fields.field || "");
      setMemoryKey(fields.memory_key || "");
    });
  }, [actionType, initial]);

  function addParam() {
    setParams([
      ...params,
      { name: "", type: "string", description: "", required: false },
    ]);
  }

  function updateParam(index: number, patch: Partial<ParamRow>) {
    setParams(params.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function removeParam(index: number) {
    setParams(params.filter((_, i) => i !== index));
  }

  async function handleAgentCreated(agent: Agent) {
    setAgents((prev) => [...prev, agent]);
    setAgentName(agent.name);
    setShowCreateAgent(false);
  }

  async function handleSave() {
    setError("");

    if (!name.trim()) {
      setError("Tool name is required.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!agentName.trim()) {
      setError("Please select an agent.");
      return;
    }

    if (params.some((p) => !p.name.trim())) {
      setError("Every parameter must have a name.");
      return;
    }
    let actionConfig: ActionConfig = {};
    if (actionType === "call_webhook")
      actionConfig = { method: webhookMethod, url: webhookUrl };
    if (actionType === "update_user_field") actionConfig = { field: fieldName };
    if (actionType === "write_user_memory")
      actionConfig = { memory_key: memoryKey };

    setSaving(true);
    try {
      await onSubmit({
        name,
        description,
        risk_tier: riskTier,
        action_type: actionType,
        agent_name: agentName || null,
        parameters_schema: rowsToSchema(params) as Record<string, unknown>,
        action_config: actionConfig as Record<string, unknown>,
      });

      setError("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={title} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-4">
        {error && <div className="text-sm text-red-400">{error}</div>}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Name (slug)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!initial}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Description (tells the AI when to use this)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Agent (which agent uses this tool)
          </label>
          <select
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.name}>
                {a.display_name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateAgent(true)}
            className="text-xs text-emerald-400 hover:underline mt-1"
          >
            Can&apos;t find your agent? + Create one
          </button>
        </div>

        {showCreateAgent && (
          <InlineAgentCreate
            onCancel={() => setShowCreateAgent(false)}
            onCreated={handleAgentCreated}
          />
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Risk Tier
          </label>
          <select
            value={riskTier}
            onChange={(e) => setRiskTier(e.target.value as Tool["risk_tier"])}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="safe">
              Safe — runs immediately, no confirmation
            </option>
            <option value="reversible">
              Reversible — asks the user to confirm first
            </option>
            <option value="destructive">
              Destructive — asks the user to confirm first
            </option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            What information does this tool need?
          </label>
          <div className="flex flex-col gap-2">
            {params.map((param, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg p-2"
              >
                <input
                  placeholder="Name"
                  value={param.name}
                  onChange={(e) => updateParam(i, { name: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={param.type}
                  onChange={(e) =>
                    updateParam(i, {
                      type: e.target.value as ParamRow["type"],
                    })
                  }
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="string">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Yes/No</option>
                </select>
                <input
                  placeholder="Description"
                  value={param.description}
                  onChange={(e) =>
                    updateParam(i, { description: e.target.value })
                  }
                  className="flex-2 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <label className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={param.required}
                    onChange={(e) =>
                      updateParam(i, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
                <button
                  onClick={() => removeParam(i)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addParam}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:underline w-fit"
            >
              <Plus size={12} /> Add a piece of information
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            What should this tool actually do?
          </label>
          <select
            value={actionType}
            onChange={(e) =>
              setActionType(e.target.value as Tool["action_type"])
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="call_webhook">Call a real API / website</option>
            <option value="update_user_field">
              Update a user&apos;s account field
            </option>
            <option value="write_user_memory">
              Save a note about the user
            </option>
          </select>
        </div>

        {actionType === "call_webhook" && (
          <div className="flex gap-2">
            <select
              value={webhookMethod}
              onChange={(e) => setWebhookMethod(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              placeholder="https://example.com/api/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {actionType === "update_user_field" && (
          <input
            placeholder="Field name (e.g. preferred_language)"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}

        {actionType === "write_user_memory" && (
          <input
            placeholder="Memory key (e.g. favorite_package)"
            value={memoryKey}
            onChange={(e) => setMemoryKey(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 hover:bg-emerald-600 transition"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Inline agent creation, embedded in the tool modal ----------

function InlineAgentCreate({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (agent: Agent) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    description: "",
    system_prompt: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    try {
      const agent = await createAgent(form);
      onCreated(agent);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3 flex flex-col gap-2">
      <span className="text-xs font-medium text-slate-300">New agent</span>
      <input
        placeholder="name (slug, e.g. billing)"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <input
        placeholder="Display name (e.g. Billing)"
        value={form.display_name}
        onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <input
        placeholder="Description (when the router should use this agent)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <textarea
        placeholder="System prompt"
        value={form.system_prompt}
        onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
        rows={3}
        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={saving || !form.name}
          className="bg-emerald-500 text-white rounded px-3 py-1.5 text-xs disabled:opacity-50 hover:bg-emerald-600 transition"
        >
          {saving ? "Creating..." : "Create & Use"}
        </button>
      </div>
    </div>
  );
}

// ---------- Reusable Modal ----------

function Modal({
  children,
  title,
  onClose,
  maxWidth = "max-w-xl",
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full ${maxWidth} p-6 max-h-[90vh] overflow-y-auto`}
      >
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
