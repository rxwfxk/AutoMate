"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteMaintenanceLogDialog({
  logId,
  vehicleId,
  typeName,
  onDeleted,
}: {
  logId: string;
  vehicleId: string;
  typeName: string;
  onDeleted?: (logId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    const result = await apiFetch(
      `/api/vehicles/${vehicleId}/maintenance-logs/${logId}`,
      { method: "DELETE" },
    );
    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }
    setOpen(false);
    onDeleted?.(logId);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`ลบบันทึก ${typeName}`}>
            <Trash2 className="text-flag-red" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบบันทึก &quot;{typeName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>การกระทำนี้ย้อนกลับไม่ได้</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-flag-red">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting && <Loader2 className="animate-spin" />}
            ลบ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
