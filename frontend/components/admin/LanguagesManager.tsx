"use client";

import { useEffect, useState } from "react";
import { Trash2, Power, Plus, X, MoreVertical } from "lucide-react";
import {
  Language,
  listLanguages,
  updateLanguage,
  createLanguage,
  deleteLanguage,
} from "@/services/languagesApi";
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

export default function LanguagesManager() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingLanguage, setDeletingLanguage] = useState<Language | null>(
    null,
  );

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
    await deleteLanguage(lang.id);
    setDeletingLanguage(null);
    load();
  }

  const columns: Column<Language>[] = [
    {
      key: "code",
      header: "Code",
      cell: (lang: Language) => (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase">
          {lang.code.substring(0, 2)}
        </div>
      ),
    },
    {
      key: "name",
      header: "Language",
      cell: (lang: Language) => (
        <span className="text-sm font-semibold text-white">{lang.name}</span>
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
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
            }
          `}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              lang.is_active ? "bg-emerald-500" : "bg-slate-500"
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
                onClick={() => handleToggleActive(lang)}
              >
                <Power size={14} />
                {lang.is_active ? "Suspend" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingLanguage(lang)}
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
      <Table<Language>
        title="Languages"
        description={
          loading
            ? "Loading languages..."
            : `Managing ${languages.length} languages.`
        }
        headerAction={
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
          >
            <Plus size={14} />
            New Language
          </Button>
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

      {deletingLanguage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-white font-semibold mb-2">
              Delete this language?
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Are you sure you want to permanently delete &ldquo;
              {deletingLanguage.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingLanguage(null)}
                className="text-sm text-slate-400 px-4 py-2 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingLanguage)}
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
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Language Code
          </label>
          <input
            placeholder="e.g. fr"
            value={form.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, code: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            ISO 639-1 language code (2 characters)
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Language Name
          </label>
          <input
            placeholder="e.g. French"
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={saving}
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
