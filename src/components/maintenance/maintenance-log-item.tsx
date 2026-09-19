import Link from "next/link";
import { Pencil } from "lucide-react";
import { cn } from "cn";

import { getMaintenanceFlagStatus, type FlagStatus } from "@/lib/flag-status";
import { Card } from "@/components/redesign/card";
import { HistoryTag, StatusDot } from "@/components/redesign/status";
import { DeleteMaintenanceLogDialog } from "@/components/maintenance/delete-maintenance-log-dialog";
import type { Document, MaintenanceLog, MaintenanceType, Vehicle } from "@/types/database.types";

export type MaintenanceLogWithType = MaintenanceLog & {
  maintenance_types: Pick<MaintenanceType, "name" | "icon" | "default_interval_km"> | null;
};

const DUE_TEXT_COLOR: Record<FlagStatus, string> = {
  red: "text-flag-overdue",
  yellow: "text-flag-due-soon",
  green: "text-ink-3",
};

export function MaintenanceLogItem({
  log,
  vehicleId,
  currentMileage,
  vehicleDetail,
  superseded = false,
  onDeleted,
}: {
  log: MaintenanceLogWithType;
  vehicleId: string;
  currentMileage: number;
  /** The page's already-loaded vehicle payload, so the delete dialog needn't refetch it. */
  vehicleDetail?: { vehicle: Vehicle; logs: MaintenanceLogWithType[]; documents: Document[] };
  /** A newer record of the same type exists — this one is history and raises no flag. */
  superseded?: boolean;
  onDeleted?: (logId: string) => void;
}) {
  const type = log.maintenance_types;
  const status: FlagStatus = superseded
    ? "green"
    : getMaintenanceFlagStatus({
        nextDueDate: log.next_due_date,
        nextDueMileage: log.next_due_mileage,
        currentMileage,
        intervalKm: type?.default_interval_km,
      });

  return (
    <Card
      size="list"
      className={cn(
        "flex items-start gap-3",
        status === "red" && "border-[1.5px] border-flag-overdue bg-flag-overdue-soft",
      )}
    >
      <StatusDot status={superseded ? "history" : status} className="mt-1.5 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className={cn("text-base font-extrabold", superseded ? "text-ink-3" : "text-ink")}>
            {type?.name ?? "ไม่ระบุประเภท"}
          </h3>
          {superseded && <HistoryTag />}
        </div>

        <p className="mt-0.5 text-[13px] text-ink-3">
          ครั้งล่าสุด{" "}
          {new Date(log.service_date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          {" · "}
          <span className="font-mono">{log.mileage_at_service.toLocaleString("th-TH")}</span> กม.
          {log.shop_name ? ` · ${log.shop_name}` : ""}
        </p>

        {(log.next_due_date || log.next_due_mileage) && (
          <p className={cn("mt-0.5 font-mono text-[13px]", superseded ? "text-ink-muted" : DUE_TEXT_COLOR[status])}>
            ครบกำหนด{" "}
            {log.next_due_mileage ? `${log.next_due_mileage.toLocaleString("th-TH")} กม.` : ""}
            {log.next_due_mileage && log.next_due_date ? " / " : ""}
            {log.next_due_date
              ? new Date(log.next_due_date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </p>
        )}

        {log.notes && <p className="mt-1 text-sm text-ink-3">{log.notes}</p>}

        {log.receipt_image_url && (
          <a
            href={log.receipt_image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm font-bold text-cta underline-offset-4 hover:underline"
          >
            ดูใบเสร็จ
          </a>
        )}
      </div>

      {log.cost !== null && (
        <p className="shrink-0 whitespace-nowrap font-mono text-[13px] text-ink-3">
          <span className="font-sans">฿ </span>
          {log.cost.toLocaleString("th-TH")}
        </p>
      )}

      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href={`/vehicles/${vehicleId}/maintenance/${log.id}/edit`}
          aria-label={`แก้ไขบันทึก ${type?.name ?? ""}`}
          className="flex size-8 items-center justify-center rounded-icon text-ink-muted hover:bg-base"
        >
          <Pencil className="size-4" />
        </Link>
        <DeleteMaintenanceLogDialog
          logId={log.id}
          vehicleId={vehicleId}
          typeName={type?.name ?? "รายการนี้"}
          detail={vehicleDetail}
          onDeleted={onDeleted}
        />
      </div>
    </Card>
  );
}
