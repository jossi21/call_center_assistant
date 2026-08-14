"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Power, Plus, MoreVertical, X } from "lucide-react";
import {
  Channel,
  ChannelTypeDef,
  listChannels,
  listChannelTypes,
  updateChannel,
  createChannel,
  deleteChannel,
  toggleChannelActive,
} from "@/services/channelsApi";
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

export default function ChannelsManager() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setChannels(await listChannels());
    } catch {
      setError("Couldn't load channels.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  async function handleToggle(channel: Channel) {
    await toggleChannelActive(channel.id);
    load();
  }

  async function handleDelete(channel: Channel) {
    await deleteChannel(channel.id);
    setDeletingChannel(null);
    load();
  }

  const columns: Column<Channel>[] = [
    {
      key: "name",
      header: "Channel",
      cell: (c: Channel) => (
        <div>
          <div className="text-sm font-semibold text-white">
            {c.display_name}
          </div>
          <div className="text-xs text-slate-400">{c.name}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c: Channel) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            c.is_active
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${c.is_active ? "bg-emerald-500" : "bg-slate-500"}`}
          />
          {c.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (c: Channel) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 rounded-full hover:bg-slate-800 text-slate-400 inline-flex items-center justify-center">
              <MoreVertical size={16} />
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
                onClick={() => setEditingChannel(c)}
              >
                <Pencil size={14} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => handleToggle(c)}
              >
                <Power size={14} />
                {c.is_active ? "Suspend" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingChannel(c)}
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
      <Table<Channel>
        title="Channels"
        description={
          loading
            ? "Loading channels..."
            : `Managing ${channels.length} channels.`
        }
        headerAction={
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
          >
            <Plus size={14} />
            New Channel
          </Button>
        }
        loading={loading}
        columns={columns}
        data={channels}
        keyExtractor={(c: Channel) => c.id}
        emptyMessage="No channels configured yet."
      />

      {editingChannel && (
        <ChannelFormModal
          initial={editingChannel}
          title={`Edit ${editingChannel.display_name}`}
          onClose={() => setEditingChannel(null)}
          onSubmit={async (data) => {
            await updateChannel(editingChannel.id, data);
            setEditingChannel(null);
            load();
          }}
        />
      )}

      {showCreate && (
        <ChannelFormModal
          title="New Channel"
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            await createChannel(
              data as {
                name: string;
                display_name: string;
                config: Record<string, unknown>;
              },
            );
            setShowCreate(false);
            load();
          }}
        />
      )}

      {deletingChannel && (
        <DeleteModal
          onClose={() => setDeletingChannel(null)}
          onConfirm={() => handleDelete(deletingChannel)}
          title={`Delete ${deletingChannel.display_name}`}
          message={`Are you sure you want to permanently delete "${deletingChannel.display_name}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
}

function ChannelFormModal({
  initial,
  title,
  onClose,
  onSubmit,
}: {
  initial?: Channel;
  title: string;
  onClose: () => void;
  onSubmit: (data: {
    name?: string;
    display_name: string;
    config: Record<string, unknown>;
  }) => Promise<void>;
}) {
  const [channelTypes, setChannelTypes] = useState<
    Record<string, ChannelTypeDef>
  >({});
  const [typesLoading, setTypesLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(initial?.name || "");
  const [displayName, setDisplayName] = useState(initial?.display_name || "");
  const [configValues, setConfigValues] = useState<Record<string, string>>(
    (initial?.config as Record<string, string>) || {},
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        setChannelTypes(await listChannelTypes());
      } finally {
        setTypesLoading(false);
      }
    });
  }, []);

  function handleTypeSelect(type: string) {
    setSelectedType(type);
    setDisplayName(channelTypes[type]?.display_name || "");
    setConfigValues({});
  }

  function handleFieldChange(key: string, value: string) {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError("");

    if (!selectedType) {
      setError("Select a channel type.");
      return;
    }

    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    const typeDef = channelTypes[selectedType];
    const missing =
      typeDef?.fields.filter((f) => f.required && !configValues[f.key]) || [];
    if (missing.length > 0) {
      setError(
        `Missing required fields: ${missing.map((f) => f.label).join(", ")}`,
      );
      return;
    }

    setSaving(true);
    try {
      if (initial) {
        await onSubmit({ display_name: displayName, config: configValues });
      } else {
        await onSubmit({
          name: selectedType,
          display_name: displayName,
          config: configValues,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  const typeDef = selectedType ? channelTypes[selectedType] : null;

  return (
    <Modal onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {error && <div className="text-sm text-red-400">{error}</div>}

        {typesLoading && (
          <div className="text-sm text-slate-400">Loading channel types...</div>
        )}

        {!typesLoading && !initial && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Channel Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeSelect(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a channel...</option>
              {Object.entries(channelTypes).map(([key, def]) => (
                <option key={key} value={key}>
                  {def.display_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedType && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {typeDef?.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {field.label}
              {field.required && " *"}
            </label>
            <input
              type={field.type}
              value={configValues[field.key] || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedType}
            className="bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
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
