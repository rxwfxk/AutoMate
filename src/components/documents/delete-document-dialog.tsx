"use client";

import { apiFetch } from "@/lib/api-client";
import { ConfirmDeleteDialog, bahtValue, type ImpactRow } from "@/components/redesign/confirm-delete-dialog";

export function DeleteDocumentDialog({
  docId,
  label,
  deleteUrl,
  cost,
  hasFile,
  triggerClassName,
  onDeleted,
}: {
  docId: string;
  label: string;
  /** e.g. `/api/vehicles/{id}/documents/{docId}` or `/api/driving-license`
   * (the license route needs no id — it's one row per user). */
  deleteUrl: string;
  cost?: number | null;
  hasFile?: boolean;
  triggerClassName?: string;
  onDeleted?: (docId: string) => void;
}) {
  const impactRows: ImpactRow[] = [
    cost !== null && cost !== undefined ? { label: "ค่าใช้จ่าย", value: bahtValue(cost) } : null,
    hasFile ? { label: "ไฟล์แนบ", value: "1 ไฟล์" } : null,
  ].filter((row): row is ImpactRow => row !== null);

  return (
    <ConfirmDeleteDialog
      triggerAriaLabel={`ลบ ${label}`}
      triggerClassName={triggerClassName}
      title={`ลบ "${label}"?`}
      description="การกระทำนี้ย้อนกลับไม่ได้"
      impactRows={impactRows}
      confirmLabel="ลบเอกสาร"
      onConfirm={() => apiFetch(deleteUrl, { method: "DELETE" })}
      onDeleted={() => onDeleted?.(docId)}
    />
  );
}
