"use client";

import { useEffect, useState } from "react";
import { Trash2, Power, Plus, X } from "lucide-react";
import {
  Language,
  listLanguages,
  updateLanguage,
  createLanguage,
  deleteLanguage,
} from "@/services/languagesApi";
import { Table, Column } from "@/components/ui/Table";
import { ActionMenu, ActionItem } from "@/components/ui/ActionMenu";

export default function LanguagesManager() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const data = await listLanguages();
      setLanguages(data);
    } catch {
      setError("Couldn't load languages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  async function handleToggleActive(lang: Language): Promise<void> {
    await updateLanguage(lang.id, { is_active: !lang.is_active });
    load();
  }

  async function handleDelete(lang: Language): Promise<void> {
    if (!confirm(`Deactivate "${lang.name}"?`)) return;
    await deleteLanguage(lang.id);
    load();
  }

  const getActions = (lang: Language): ActionItem[] => [
    {
      label: lang.is_active ? "Suspend" : "Activate",
      icon: <Power size={15} />,
      onClick: () => handleToggleActive(lang),
    },
    {
      label: "Delete",
      icon: <Trash2 size={15} />,
      color: "text-red-600",
      hoverColor: "hover:bg-red-50",
      divider: true,
      onClick: () => handleDelete(lang),
    },
  ];

  const columns: Column<Language>[] = [
    {
      key: "code",
      header: "Code",
      cell: (lang: Language) => (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold uppercase">
          {lang.code.substring(0, 2)}
        </div>
      ),
    },
    {
      key: "name",
      header: "Language",
      cell: (lang: Language) => (
        <span className="text-sm font-semibold text-zinc-900">{lang.name}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (lang: Language) => (
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
            ${
              lang.is_active
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                : "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20"
            }
          `}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              lang.is_active ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {lang.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (lang: Language) => (
        <div className="flex justify-end">
          <ActionMenu actions={getActions(lang)} />
        </div>
      ),
    },
  ];

  if (error) return <div className="p-8 text-red-500 text-sm">{error}</div>;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3 p-3 sm:p-4 md:p-5">
      <Table<Language>
        title="Languages"
        description={
          loading
            ? "Loading languages..."
            : `Managing ${languages.length} languages.`
        }
        headerAction={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-green-400 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-500 transition-colors shadow-sm shadow-indigo-500/20"
          >
            <Plus size={18} />
            New Language
          </button>
        }
        loading={loading}
        columns={columns}
        data={languages}
        keyExtractor={(lang: Language) => lang.id}
        emptyMessage="No languages found. Create your first language to get started."
      />

      {showCreate && (
        <CreateLanguageModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateLanguageModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ code: "", name: "" });
  const [saving, setSaving] = useState(false);

  async function handleCreate(): Promise<void> {
    setSaving(true);
    try {
      await createLanguage(form);
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="New Language">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Language Code
          </label>
          <input
            placeholder="e.g. fr"
            value={form.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, code: e.target.value })
            }
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[10px] text-zinc-400 mt-1">
            ISO 639-1 language code (2 characters)
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Language Name
          </label>
          <input
            placeholder="e.g. French"
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 hover:bg-emerald-600 transition"
          >
            {saving ? "Creating..." : "Create"}
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
