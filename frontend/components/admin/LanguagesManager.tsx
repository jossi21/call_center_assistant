"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import {
  Language,
  listLanguages,
  updateLanguage,
  createLanguage,
  deleteLanguage,
} from "@/services/languagesApi";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/FilterBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusFilter = "all" | "active" | "inactive";
type TimeFilter = "all" | "week" | "month" | "6months";

type LanguageFilters = {
  status: StatusFilter;
  time: TimeFilter;
  customFrom: string;
  customTo: string;
  showArchived: boolean;
};

type OpenFilter = "status" | "time" | "custom" | null;

export default function LanguagesManager() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<LanguageFilters>({
    status: "all",
    time: "all",
    customFrom: "",
    customTo: "",
    showArchived: false,
  });

  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);

  const [customDraft, setCustomDraft] = useState({
    from: "",
    to: "",
  });

  const [showCreate, setShowCreate] = useState(false);
  const [deletingLanguage, setDeletingLanguage] = useState<Language | null>(
    null,
  );

  const [now, setNow] = useState(() => Date.now());

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  async function handleToggleActive(lang: Language): Promise<void> {
    try {
      await updateLanguage(lang.id, {
        is_active: !lang.is_active,
      });

      await load();
    } catch {
      setError("Couldn't update language status.");
    }
  }

  async function handleDelete(lang: Language): Promise<void> {
    try {
      await deleteLanguage(lang.id);
      setDeletingLanguage(null);
      await load();
    } catch {
      setError("Couldn't delete language.");
    }
  }

  function updateFilters(patch: Partial<LanguageFilters>): void {
    setFilters((current) => ({
      ...current,
      ...patch,
    }));
  }

  function openCustomFilter(): void {
    setCustomDraft({
      from: filters.customFrom,
      to: filters.customTo,
    });

    setOpenFilter("custom");
  }

  function applyCustomFilter(): void {
    setFilters((current) => ({
      ...current,
      time: "all",
      customFrom: customDraft.from,
      customTo: customDraft.to,
    }));

    setOpenFilter(null);
  }

  function clearCustomFilter(): void {
    setCustomDraft({
      from: "",
      to: "",
    });

    setFilters((current) => ({
      ...current,
      customFrom: "",
      customTo: "",
    }));

    setOpenFilter(null);
  }

  function resetFilters(): void {
    setFilters({
      status: "all",
      time: "all",
      customFrom: "",
      customTo: "",
      showArchived: false,
    });

    setCustomDraft({
      from: "",
      to: "",
    });

    setOpenFilter(null);
  }

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.time !== "all" ||
    Boolean(filters.customFrom || filters.customTo) ||
    filters.showArchived;

  const filteredLanguages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return languages.filter((language) => {
      const searchableText = [language.name, language.code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !searchableText.includes(query)) {
        return false;
      }

      const languageWithArchive = language as Language & {
        is_archived?: boolean;
        archived?: boolean;
        archived_at?: string | null;
        archivedAt?: string | null;
        created_at?: string | null;
        createdAt?: string | null;
        updated_at?: string | null;
        updatedAt?: string | null;
      };

      const isArchived =
        Boolean(languageWithArchive.is_archived) ||
        Boolean(languageWithArchive.archived) ||
        Boolean(languageWithArchive.archived_at) ||
        Boolean(languageWithArchive.archivedAt);

      if (!filters.showArchived && isArchived) {
        return false;
      }

      if (filters.status === "active" && !language.is_active) {
        return false;
      }

      if (filters.status === "inactive" && language.is_active) {
        return false;
      }

      const rawDate =
        languageWithArchive.updated_at ||
        languageWithArchive.updatedAt ||
        languageWithArchive.created_at ||
        languageWithArchive.createdAt;

      if (filters.time !== "all" && rawDate) {
        const languageDate = new Date(rawDate).getTime();

        if (!Number.isNaN(languageDate)) {
          const diff = now - languageDate;

          const week = 7 * 24 * 60 * 60 * 1000;
          const month = 30 * 24 * 60 * 60 * 1000;
          const sixMonths = 6 * month;

          if (filters.time === "week" && diff > week) {
            return false;
          }

          if (filters.time === "month" && diff > month) {
            return false;
          }

          if (filters.time === "6months" && diff > sixMonths) {
            return false;
          }
        }
      }

      if (filters.customFrom || filters.customTo) {
        if (!rawDate) {
          return false;
        }

        const languageDate = new Date(rawDate);

        if (filters.customFrom) {
          const from = new Date(`${filters.customFrom}T00:00:00`);

          if (languageDate < from) {
            return false;
          }
        }

        if (filters.customTo) {
          const to = new Date(`${filters.customTo}T23:59:59`);

          if (languageDate > to) {
            return false;
          }
        }
      }

      return true;
    });
  }, [languages, search, filters, now]);

  const customLabel =
    filters.customFrom || filters.customTo
      ? getCustomDateLabel(filters.customFrom, filters.customTo)
      : "Custom";

  const columns: Column<Language>[] = [
    {
      key: "code",
      header: "Code",
      cell: (lang: Language) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs font-bold uppercase text-emerald-400">
            {lang.code.substring(0, 2)}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase text-white">
              {lang.code}
            </span>

            <span className="text-xs text-slate-500">ISO 639-1</span>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      header: "Language",
      cell: (lang: Language) => (
        <span className="text-sm font-medium text-slate-200">{lang.name}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (lang: Language) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            lang.is_active
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
          }`}
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
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <MoreVertical size={16} />
                </Button>
              }
            />

            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border border-slate-800 bg-slate-900 p-1"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-slate-500">
                Language Actions
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

  return (
    <div className="min-h-full bg-[#020f1d] text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:p-4 md:p-5 lg:p-6">
        {/* HEADER + FILTERS */}
        <div className="relative z-30 overflow-visible rounded-2xl border border-[#12324d] bg-[#031526] shadow-[0_0_40px_rgba(0,90,150,0.08)]">
          <div className="p-5 sm:p-6 lg:p-7">
            {/* HEADER */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Languages
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Manage and configure supported languages
                </p>
              </div>

              <Button
                onClick={() => setShowCreate(true)}
                className="h-10 gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-600"
              >
                <Plus size={15} />
                New Language
              </Button>
            </div>

            {/* FILTERS */}
            <div className="mt-6">
              <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search languages..."
                onReset={() => {
                  setSearch("");
                  resetFilters();
                }}
                showReset={hasActiveFilters || Boolean(search)}
                leading={
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#123957] bg-[#061d31] text-slate-400 transition hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white"
                  >
                    <ChevronLeft
                      size={18}
                      className="transition-transform group-hover:-translate-x-0.5"
                    />
                  </button>
                }
              >
                {/* STATUS */}
                <FilterDropdownButton
                  label="Status"
                  value={
                    filters.status === "all"
                      ? "All"
                      : filters.status === "active"
                        ? "Active"
                        : "Inactive"
                  }
                  active={filters.status !== "all"}
                  open={openFilter === "status"}
                  onClick={() =>
                    setOpenFilter(openFilter === "status" ? null : "status")
                  }
                >
                  <FilterOption
                    selected={filters.status === "all"}
                    onClick={() => {
                      updateFilters({ status: "all" });
                      setOpenFilter(null);
                    }}
                  >
                    All
                  </FilterOption>

                  <FilterOption
                    selected={filters.status === "active"}
                    onClick={() => {
                      updateFilters({ status: "active" });
                      setOpenFilter(null);
                    }}
                  >
                    Active
                  </FilterOption>

                  <FilterOption
                    selected={filters.status === "inactive"}
                    onClick={() => {
                      updateFilters({ status: "inactive" });
                      setOpenFilter(null);
                    }}
                  >
                    Inactive
                  </FilterOption>
                </FilterDropdownButton>

                {/* TIME */}
                <FilterDropdownButton
                  label="Time"
                  value={
                    filters.time === "all"
                      ? "All"
                      : filters.time === "week"
                        ? "Week"
                        : filters.time === "month"
                          ? "Month"
                          : "6 Months"
                  }
                  active={filters.time !== "all"}
                  open={openFilter === "time"}
                  onClick={() =>
                    setOpenFilter(openFilter === "time" ? null : "time")
                  }
                >
                  <FilterOption
                    selected={filters.time === "all"}
                    onClick={() => {
                      updateFilters({
                        time: "all",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    All
                  </FilterOption>

                  <FilterOption
                    selected={filters.time === "week"}
                    onClick={() => {
                      updateFilters({
                        time: "week",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    Week
                  </FilterOption>

                  <FilterOption
                    selected={filters.time === "month"}
                    onClick={() => {
                      updateFilters({
                        time: "month",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    Month
                  </FilterOption>

                  <FilterOption
                    selected={filters.time === "6months"}
                    onClick={() => {
                      updateFilters({
                        time: "6months",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    6 Months
                  </FilterOption>
                </FilterDropdownButton>

                {/* CUSTOM */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Custom
                  </span>

                  <button
                    type="button"
                    onClick={openCustomFilter}
                    className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm outline-none transition ${
                      filters.customFrom || filters.customTo
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-[#123957] bg-[#061d31] text-white hover:border-[#1b4b6d] hover:bg-[#08253b]"
                    }`}
                  >
                    <Calendar size={15} className="text-slate-400" />

                    <span className="whitespace-nowrap">
                      {filters.customFrom || filters.customTo
                        ? customLabel
                        : "Select dates"}
                    </span>
                  </button>

                  {openFilter === "custom" && (
                    <div className="absolute right-0 top-12 z-100 w-72 rounded-xl border border-[#173a55] bg-[#061a2b] p-4 shadow-2xl">
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-white">
                          Custom date range
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Filter languages by creation or update date.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            From
                          </label>

                          <input
                            type="date"
                            value={customDraft.from}
                            onChange={(e) =>
                              setCustomDraft((current) => ({
                                ...current,
                                from: e.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-white outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            To
                          </label>

                          <input
                            type="date"
                            value={customDraft.to}
                            onChange={(e) =>
                              setCustomDraft((current) => ({
                                ...current,
                                to: e.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-white outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-[#173a55] pt-3">
                          <button
                            type="button"
                            onClick={clearCustomFilter}
                            className="text-xs font-medium text-slate-400 transition hover:text-white"
                          >
                            Clear
                          </button>

                          <button
                            type="button"
                            onClick={applyCustomFilter}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ARCHIVE */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Archive
                  </span>

                  <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-slate-300 transition hover:border-[#1b4b6d] hover:bg-[#08253b]">
                    <input
                      type="checkbox"
                      checked={filters.showArchived}
                      onChange={(e) =>
                        updateFilters({
                          showArchived: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                    />

                    <span className="whitespace-nowrap">Show archived</span>
                  </label>
                </div>
              </FilterBar>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="border-t border-red-500/10 bg-red-500/5 px-5 py-3 text-sm text-red-400 sm:px-6 lg:px-7">
              {error}
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="relative z-10 overflow-hidden rounded-2xl border border-[#173a55] bg-[#061d31] shadow-[0_0_40px_rgba(0,90,150,0.06)]">
          <Table<Language>
            loading={loading}
            columns={columns}
            data={filteredLanguages}
            keyExtractor={(lang: Language) => lang.id}
            emptyMessage={
              search || hasActiveFilters
                ? "No languages match your current search or filter."
                : "No languages found. Create your first language to get started."
            }
          />

          {!loading && languages.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-[#123957] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-300">
                  {filteredLanguages.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-300">
                  {languages.length}
                </span>{" "}
                languages
              </p>

              {(hasActiveFilters || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    resetFilters();
                  }}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE */}
      {showCreate && (
        <CreateLanguageModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {/* DELETE */}
      {deletingLanguage && (
        <DeleteLanguageModal
          language={deletingLanguage}
          onClose={() => setDeletingLanguage(null)}
          onDelete={() => handleDelete(deletingLanguage)}
        />
      )}
    </div>
  );
}

function FilterDropdownButton({
  label,
  value,
  active,
  open,
  onClick,
  children,
}: {
  label: string;
  value: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <button
        type="button"
        onClick={onClick}
        className={`flex h-10 items-center justify-between gap-4 rounded-xl border px-3 text-sm outline-none transition ${
          active
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : "border-[#123957] bg-[#061d31] text-white hover:border-[#1b4b6d] hover:bg-[#08253b]"
        }`}
      >
        <span>{value}</span>

        <ChevronDown
          size={15}
          className={`text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-100 min-w-42.5 rounded-xl border border-[#173a55] bg-[#061a2b] p-1.5 shadow-2xl">
          {children}
        </div>
      )}
    </div>
  );
}

function FilterOption({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
        selected
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-slate-300 hover:bg-[#08253b] hover:text-white"
      }`}
    >
      <span>{children}</span>

      {selected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
    </button>
  );
}

function CreateLanguageModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(): Promise<void> {
    if (!form.code.trim() || !form.name.trim()) {
      setError("Language code and language name are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createLanguage({
        code: form.code.trim().toLowerCase(),
        name: form.name.trim(),
      });

      onCreated();
    } catch {
      setError("Couldn't create language.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="New Language">
      <div className="flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <FormInput
          label="Language Code"
          placeholder="e.g. fr"
          value={form.code}
          onChange={(value) =>
            setForm({
              ...form,
              code: value,
            })
          }
          hint="ISO 639-1 language code (2 characters)"
        />

        <FormInput
          label="Language Name"
          placeholder="e.g. French"
          value={form.name}
          onChange={(value) =>
            setForm({
              ...form,
              name: value,
            })
          }
        />

        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreate}
            disabled={saving}
            className="rounded-xl bg-emerald-500 px-5 text-white hover:bg-emerald-600"
          >
            {saving ? "Creating..." : "Create Language"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteLanguageModal({
  language,
  onClose,
  onDelete,
}: {
  language: Language;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(): Promise<void> {
    setDeleting(true);

    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Delete Language">
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
          <p className="text-sm leading-6 text-slate-300">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-white">{language.name}</span>?
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-5 text-white hover:bg-red-700"
          >
            {deleting ? "Deleting..." : "Delete Language"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </label>

      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-800 bg-[#041a2b] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
      />

      {hint && <p className="mt-1.5 text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MODAL                                                                      */
/* -------------------------------------------------------------------------- */

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#173a55] bg-[#061d31] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#173a55] px-5 py-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function getCustomDateLabel(from: string, to: string): string {
  if (from && to) {
    return `${from} → ${to}`;
  }

  if (from) {
    return `From ${from}`;
  }

  if (to) {
    return `Until ${to}`;
  }

  return "Custom";
}
