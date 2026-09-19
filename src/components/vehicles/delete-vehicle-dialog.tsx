"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { ConfirmDeleteDialog, bahtValue, type ImpactRow } from "@/components/redesign/confirm-delete-dialog";
import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";
import type { Document, Vehicle } from "@/types/database.types";

export const VEHICLES_CHANGED_EVENT = "vehicles-changed";

type VehicleDetailResponse = { vehicle: Vehicle; logs: MaintenanceLogWithType[]; documents: Document[] };

export function DeleteVehicleDialog({
  vehicleId,
  vehicleName,
  detail,
  triggerClassName,
  onDeleted,
}: {
  vehicleId: string;
  vehicleName: string;
  /** Pass what the page already holds to skip the refetch on open (vehicle-card.tsx has none, so it omits this). */
  detail?: VehicleDetailResponse;
  triggerClassName?: string;
  onDeleted?: (id: string) => void;
}) {
  const [impactRows, setImpactRows] = useState<ImpactRow[] | null | undefined>(undefined);

  function applyDetail({ vehicle, logs, documents }: VehicleDetailResponse) {
    const fileCount =
      (vehicle.image_url ? 1 : 0) +
      logs.filter((l) => l.receipt_image_url).length +
      documents.filter((d) => d.file_url).length;
    const totalCost =
      logs.reduce((sum, l) => sum + (l.cost ?? 0), 0) + documents.reduce((sum, d) => sum + (d.cost ?? 0), 0);

    setImpactRows([
      { label: "บันทึกซ่อมบำรุง", value: `${logs.length} รายการ` },
      { label: "เอกสาร", value: `${documents.length} ฉบับ` },
      { label: "รูปภาพและใบเสร็จ", value: `${fileCount} ไฟล์` },
      { label: "ประวัติค่าใช้จ่าย", value: bahtValue(totalCost) },
    ]);
  }

  // Uses the caller's data when given; otherwise fetches fresh on every open.
  async function loadImpact() {
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

  return (
    <ConfirmDeleteDialog
      triggerAriaLabel={`ลบ ${vehicleName}`}
      triggerClassName={triggerClassName}
      title={`ลบ "${vehicleName}" ออกจากบัญชี`}
      description="ประวัติการซ่อมบำรุงและเอกสารทั้งหมดของรถคันนี้จะถูกลบไปด้วย การกระทำนี้ย้อนกลับไม่ได้"
      impactRows={impactRows}
      impactLoading={impactRows === undefined}
      exitNote="ส่งออกเป็น CSV ที่หน้าโปรไฟล์ก่อนลบได้"
      confirmLabel="ลบรถ"
      onOpen={loadImpact}
      onConfirm={() => apiFetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" })}
      onDeleted={() => {
        // Lets the sidebar's vehicle-count badge refresh without a page reload.
        window.dispatchEvent(new Event(VEHICLES_CHANGED_EVENT));
        onDeleted?.(vehicleId);
      }}
    />
  );
}
