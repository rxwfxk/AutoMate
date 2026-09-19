"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { getMaintenanceFlagStatus, FLAG_LABEL } from "@/lib/flag-status";
import { ConfirmDeleteDialog, bahtValue, type ImpactRow } from "@/components/redesign/confirm-delete-dialog";
import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";
import type { Document, Vehicle } from "@/types/database.types";

type VehicleDetailResponse = { vehicle: Vehicle; logs: MaintenanceLogWithType[]; documents: Document[] };

export function DeleteMaintenanceLogDialog({
  logId,
  vehicleId,
  typeName,
  detail,
  triggerClassName,
  onDeleted,
}: {
  logId: string;
  vehicleId: string;
  typeName: string;
  /** Pass what the page already holds to skip the refetch on open. */
  detail?: VehicleDetailResponse;
  triggerClassName?: string;
  onDeleted?: (logId: string) => void;
}) {
  const [impactRows, setImpactRows] = useState<ImpactRow[] | null | undefined>(undefined);
  const [flagWarning, setFlagWarning] = useState<string | undefined>(undefined);

  async function loadImpact() {
    setFlagWarning(undefined);
    if (detail) {
      applyDetail(detail);
      return;
    }
    setImpactRows(undefined);
    const result = await apiFetch<VehicleDetailResponse>(`/api/vehicles/${vehicleId}`);
    if (result.error) {
      setImpactRows(null);
      return;
    }
    applyDetail(result.data!);
  }

  function applyDetail({ vehicle, logs }: VehicleDetailResponse) {
    const current = logs.find((l) => l.id === logId);
    if (!current) {
      setImpactRows(null);
      return;
    }

    setImpactRows([
      current.cost !== null
        ? { label: "ค่าใช้จ่าย", value: bahtValue(current.cost) }
        : null,
      current.receipt_image_url ? { label: "ไฟล์แนบ", value: "1 ไฟล์" } : null,
    ].filter((row): row is ImpactRow => row !== null));

    // Same maintenance type on this vehicle, oldest first — deleting only
    // changes the ACTIVE due schedule (and so the flag) when it's the most
    // recent entry, since an older entry never defined "what's due now" to
    // begin with. See README 4b: "ลบแล้วรอบครบกำหนดจะคำนวณใหม่จากบันทึกก่อนหน้า".
    const sameType = logs
      .filter((l) => l.maintenance_type_id === current.maintenance_type_id)
      .sort((a, b) => a.service_date.localeCompare(b.service_date));
    const index = sameType.findIndex((l) => l.id === logId);
    const isMostRecent = index === sameType.length - 1;

    if (isMostRecent && index === 0) {
      setFlagWarning("จะไม่มีข้อมูลติดตามงานนี้อีก");
    } else if (isMostRecent && index > 0) {
      const previous = sameType[index - 1];
      const status = getMaintenanceFlagStatus({
        nextDueDate: previous.next_due_date,
        nextDueMileage: previous.next_due_mileage,
        currentMileage: vehicle.current_mileage,
        intervalKm: previous.maintenance_types?.default_interval_km,
      });
      if (status !== "green") {
        setFlagWarning(`จะเปลี่ยนเป็น ${status === "red" ? "🔴" : "🟡"} ${FLAG_LABEL[status]}`);
      }
    }
  }

  return (
    <ConfirmDeleteDialog
      triggerAriaLabel={`ลบบันทึก ${typeName}`}
      triggerClassName={triggerClassName}
      title={`ลบบันทึก "${typeName}"?`}
      description="การกระทำนี้ย้อนกลับไม่ได้"
      impactRows={impactRows}
      impactLoading={impactRows === undefined}
      flagWarning={flagWarning}
      confirmLabel="ลบบันทึก"
      onOpen={loadImpact}
      onConfirm={() => apiFetch(`/api/vehicles/${vehicleId}/maintenance-logs/${logId}`, { method: "DELETE" })}
      onDeleted={() => onDeleted?.(logId)}
    />
  );
}
