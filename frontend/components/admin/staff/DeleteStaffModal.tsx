"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Staff } from "@/services/staffsApi";

export function DeleteStaffModal({
  staff,
  onClose,
  onConfirm,
}: {
  staff: Staff;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Modal onClose={onClose} title={`Delete ${staff.email}`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground">
          Are you sure you want to permanently remove &ldquo;{staff.email}
          &rdquo; as a staff member? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-destructive text-destructive-foreground"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
