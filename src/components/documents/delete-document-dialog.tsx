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

export function DeleteDocumentDialog({
  docId,
  label,
  deleteUrl,
  onDeleted,
}: {
  docId: string;
  label: string;
  /** e.g. `/api/vehicles/{id}/documents/{docId}` or `/api/driving-license`
   * (the license route needs no id — it's one row per user). */
  deleteUrl: string;
  onDeleted?: (docId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    const result = await apiFetch(deleteUrl, { method: "DELETE" });
    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }
    setOpen(false);
    onDeleted?.(docId);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`ลบ ${label}`}>
            <Trash2 className="text-flag-red" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบ &quot;{label}&quot;?</AlertDialogTitle>
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
