"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Power, Plus, X, MoreVertical } from "lucide-react";
import {
  Template,
  listTemplates,
  updateTemplate,
  createTemplate,
  deleteTemplate,
} from "@/services/templatesApi";
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

const CATEGORY_OPTIONS = [
  "billing",
  "refund",
  "apology",
  "payment",
  "greeting",
];

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(
    null,
  );

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const data = await listTemplates();
      setTemplates(data);
    } catch {
      setError("Couldn't load templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  async function handleToggleActive(template: Template): Promise<void> {
    await updateTemplate(template.id, { is_active: !template.is_active });
    load();
  }

  async function handleDelete(template: Template): Promise<void> {
    await deleteTemplate(template.id);
    setDeletingTemplate(null);
    load();
  }

  const columns: Column<Template>[] = [
    {
      key: "title",
      header: "Template",
      cell: (template: Template) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold uppercase">
            {template.title.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              {template.title}
            </div>
            <div className="text-xs text-slate-400 truncate max-w-xs">
              {template.body}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (template: Template) => (
        <span className="text-xs text-slate-400">
          {template.category || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (template: Template) => (
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
            ${
              template.is_active
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
            }
          `}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              template.is_active ? "bg-emerald-500" : "bg-slate-500"
            }`}
          />
          {template.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (template: Template) => (
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
                onClick={() => setEditingTemplate(template)}
              >
                <Pencil size={14} />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => handleToggleActive(template)}
              >
                <Power size={14} />
                {template.is_active ? "Suspend" : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingTemplate(template)}
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
      <Table<Template>
        title="Reply Templates"
        description={
          loading
            ? "Loading templates..."
            : `Managing ${templates.length} templates.`
        }
        headerAction={
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
          >
            <Plus size={14} />
            New Template
          </Button>
        }
        loading={loading}
        columns={columns}
        data={templates}
        keyExtractor={(template: Template) => template.id}
        emptyMessage="No templates found. Create your first quick-reply template to get started."
      />

      {editingTemplate && (
        <TemplateFormModal
          initial={editingTemplate}
          title={`Edit ${editingTemplate.title}`}
          onClose={() => setEditingTemplate(null)}
          onSubmit={async (data) => {
            await updateTemplate(editingTemplate.id, data);
            setEditingTemplate(null);
            load();
          }}
        />
      )}

      {showCreate && (
        <TemplateFormModal
          title="New Template"
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            await createTemplate(data as Omit<Template, "id" | "is_active">);
            setShowCreate(false);
            load();
          }}
        />
      )}

      {deletingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-white font-semibold mb-2">
              Delete this template?
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Are you sure you want to permanently delete &ldquo;
              {deletingTemplate.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingTemplate(null)}
                className="text-sm text-slate-400 px-4 py-2 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingTemplate)}
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

function TemplateFormModal({
  initial,
  title,
  onClose,
  onSubmit,
}: {
  initial?: Template;
  title: string;
  onClose: () => void;
  onSubmit: (data: Partial<Template>) => Promise<void>;
}) {
  const [formTitle, setFormTitle] = useState(initial?.title || "");
  const [body, setBody] = useState(initial?.body || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError("");
    if (!formTitle.trim()) {
      setError("Title is required.");
      return;
    }
    if (!body.trim()) {
      setError("Body text is required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: formTitle,
        body,
        category: category || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {error && <div className="text-sm text-red-400">{error}</div>}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Title
          </label>
          <input
            placeholder="e.g. Billing Issue"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Reply text
          </label>
          <textarea
            placeholder="The message text staff will insert into their reply..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Category (controls the icon shown to staff)
          </label>
          <input
            list="template-categories"
            placeholder="e.g. billing"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <datalist id="template-categories">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

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
