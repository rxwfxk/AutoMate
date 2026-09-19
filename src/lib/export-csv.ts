import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";
import { DOCUMENT_TYPE_LABEL } from "@/lib/document-types";
import type { Document, Vehicle } from "@/types/database.types";

/** Escapes a value for a CSV cell — wraps in quotes and doubles any quotes
 * inside whenever the value contains a comma, quote, or newline. */
function csvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(",");
}

/**
 * Builds the "ส่งออกข้อมูลทั้งหมด (CSV)" export for the profile page's
 * "ข้อมูลของฉัน" card — one flat table mixing maintenance logs and vehicle
 * documents (each row tagged by `ประเภทแถว`) since a user's mental model is
 * "everything I've spent on this vehicle", not two separate files.
 */
export function buildAccountDataCsv(
  vehicles: Vehicle[],
  logsByVehicle: Map<string, MaintenanceLogWithType[]>,
  documentsByVehicle: Map<string, Document[]>,
): string {
  const rows: string[] = [
    toRow(["ประเภทแถว", "รถ", "รายการ", "วันที่", "เลขไมล์", "ค่าใช้จ่าย", "ร้าน/บริษัท", "หมายเหตุ"]),
  ];

  for (const vehicle of vehicles) {
    for (const log of logsByVehicle.get(vehicle.id) ?? []) {
      rows.push(
        toRow([
          "ซ่อมบำรุง",
          vehicle.name,
          log.maintenance_types?.name ?? "ไม่ระบุประเภท",
          log.service_date,
          log.mileage_at_service,
          log.cost,
          log.shop_name,
          log.notes,
        ]),
      );
    }
    for (const doc of documentsByVehicle.get(vehicle.id) ?? []) {
      rows.push(
        toRow([
          "เอกสาร",
          vehicle.name,
          DOCUMENT_TYPE_LABEL[doc.document_type],
          doc.expiry_date,
          null,
          doc.cost,
          doc.policy_number,
          null,
        ]),
      );
    }
  }

  // Leading BOM so Excel opens UTF-8 Thai text correctly instead of mojibake.
  return "﻿" + rows.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
