"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Power, Plus, MoreVertical, Eye } from "lucide-react";
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
  const router = useRouter();
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
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold uppercase">
            {member.name.charAt(0)}
          </div>
          <span className="text-sm font-semibold text-white">
            {member.name}
          </span>
        </div>
      ),
    },
    {
      key: "phone_number",
      header: "Phone",
      cell: (member: Staff) => (
        <span className="text-xs text-slate-400 font-mono">
          {member.phone_number || "—"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (member: Staff) => (
        <span className="text-xs text-slate-400">{member.email}</span>
      ),
    },
    {
      key: "specialty",
      header: "Specialty",
      cell: (member: Staff) => (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
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
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
          }
        `}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${member.is_available ? "bg-emerald-500" : "bg-slate-500"}`}
          />
          {member.is_available ? "Available" : "Unavailable"}
        </span>
      ),
    },
    {
      key: "case_status",
      header: "Case Status",
      cell: (member: Staff) =>
        member.active_case_count > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            On Case ({member.active_case_count})
          </span>
        ) : (
          <span className="text-xs text-slate-500">Free</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (member: Staff) => (
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
                onClick={() => router.push(`/admin/staffs/${member.id}`)}
              >
                <Eye size={14} />
                View Details
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => setEditingStaff(member)}
              >
                <Pencil size={14} />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => handleToggle(member)}
              >
                <Power size={14} />
                {member.is_available ? "Mark Unavailable" : "Mark Available"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
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
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error}
      </div>
    );

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
            className="h-8 gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
          >
            <Plus size={14} />
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
