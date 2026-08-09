"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Power, Plus, MoreVertical } from "lucide-react";
import {
  Staff,
  listStaff,
  updateStaff,
  toggleStaffActive,
  createStaff,
  deleteStaff,
} from "@/services/staffsApi";
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
import { StaffFormModal } from "./staff/staffFormModal";
import { DeleteStaffModal } from "./staff/DeleteStaffModal";

export default function StaffManager() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      setStaff(await listStaff());
    } catch {
      setError("Couldn't load staff.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  async function handleToggle(member: Staff): Promise<void> {
    await toggleStaffActive(member.id, !member.is_available);
    load();
  }

  async function handleDelete(member: Staff): Promise<void> {
    await deleteStaff(member.id);
    setDeletingStaff(null);
    load();
  }

  const columns: Column<Staff>[] = [
    {
      key: "name",
      header: "Name",
      cell: (member: Staff) => (
        <span className="text-sm font-semibold text-zinc-900">
          {member.name}
        </span>
      ),
    },
    {
      key: "phone_number",
      header: "Phone",
      cell: (member: Staff) => (
        <span className="text-xs text-zinc-600 font-mono">
          {member.phone_number || "—"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (member: Staff) => (
        <span className="text-xs text-zinc-600">{member.email}</span>
      ),
    },
    {
      key: "specialty",
      header: "Specialty",
      cell: (member: Staff) => (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20">
          {member.specialty}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (member: Staff) => (
        <span
          className={`
          inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
          ${
            member.is_available
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
              : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-600/10"
          }
        `}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${member.is_available ? "bg-emerald-500" : "bg-zinc-400"}`}
          />
          {member.is_available ? "Available" : "Unavailable"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (member: Staff) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted/50"
                >
                  <MoreVertical size={16} className="text-muted-foreground" />
                </Button>
              }
            />

            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium"
                onClick={() => setEditingStaff(member)}
              >
                <Pencil size={14} className="text-muted-foreground" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium"
                onClick={() => handleToggle(member)}
              >
                <Power size={14} className="text-muted-foreground" />
                {member.is_available ? "Mark Unavailable" : "Mark Available"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => setDeletingStaff(member)}
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
    return <div className="p-8 text-red-500 text-sm bg-white m-6">{error}</div>;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3 p-3 sm:p-4 md:p-5">
      <Table<Staff>
        title="Staff"
        description={
          loading
            ? "Loading staff..."
            : `Managing ${staff.length} staff members.`
        }
        headerAction={
          <Button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-green-400 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-500 transition-colors shadow-sm shadow-indigo-500/20 cursor-pointer"
          >
            <Plus size={18} />
            New Staff Member
          </Button>
        }
        loading={loading}
        columns={columns}
        data={staff}
        keyExtractor={(member: Staff) => member.id}
        emptyMessage="No staff members found. Add your first one to get started."
      />

      {editingStaff && (
        <StaffFormModal
          initial={editingStaff}
          title={`Edit ${editingStaff.email}`}
          onClose={() => setEditingStaff(null)}
          onSubmit={async (data) => {
            await updateStaff(editingStaff.id, {
              name: data.name,
              email: data.email,
              specialty: data.specialty,
            });
            setEditingStaff(null);
            load();
          }}
        />
      )}

      {showCreate && (
        <StaffFormModal
          title="New Staff Member"
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            await createStaff({
              phone_number: data.phone_number!,
              name: data.name,
              email: data.email,
              specialty: data.specialty,
            });
            setShowCreate(false);
            load();
          }}
        />
      )}

      {deletingStaff && (
        <DeleteStaffModal
          staff={deletingStaff}
          onClose={() => setDeletingStaff(null)}
          onConfirm={() => handleDelete(deletingStaff)}
        />
      )}
    </div>
  );
}
