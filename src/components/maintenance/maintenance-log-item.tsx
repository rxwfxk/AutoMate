import Link from "next/link";
import { Pencil } from "lucide-react";

import { getMaintenanceFlagStatus } from "@/lib/flag-status";
import { getMaintenanceIcon } from "@/lib/maintenance-icons";
import { FlagBadge } from "@/components/ui/flag-badge";
import { buttonVariants } from "@/components/ui/button";
import { DeleteMaintenanceLogDialog } from "@/components/maintenance/delete-maintenance-log-dialog";
import type { MaintenanceLog, MaintenanceType } from "@/types/database.types";

export type MaintenanceLogWithType = MaintenanceLog & {
  maintenance_types: Pick<MaintenanceType, "name" | "icon" | "default_interval_km"> | null;
};

export function MaintenanceLogItem({
  log,
  vehicleId,
  currentMileage,
}: {
  log: MaintenanceLogWithType;
  vehicleId: string;
  currentMileage: number;
}) {
  const type = log.maintenance_types;
  const Icon = getMaintenanceIcon(type?.icon ?? null);
  const status = getMaintenanceFlagStatus({
    nextDueDate: log.next_due_date,
    nextDueMileage: log.next_due_mileage,
    currentMileage,
    intervalKm: type?.default_interval_km,
  });

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">{type?.name ?? "ไม่ระบุประเภท"}</h3>
          <FlagBadge status={status} />
        </div>

        <p className="text-sm text-muted-foreground">
          {new Date(log.service_date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          {" · "}
          <span className="font-mono">{log.mileage_at_service.toLocaleString("th-TH")}</span> กม.
          {log.shop_name ? ` · ${log.shop_name}` : ""}
        </p>

        {log.cost !== null && (
          <p className="text-sm">
            <span className="font-sans">฿ </span>
            <span className="font-mono">{log.cost.toLocaleString("th-TH")}</span>
          </p>
        )}

        {(log.next_due_date || log.next_due_mileage) && (
          <p className="text-xs text-muted-foreground">
            รอบถัดไป:{" "}
            {log.next_due_mileage && (
              <span className="font-mono">{log.next_due_mileage.toLocaleString("th-TH")} กม.</span>
            )}
            {log.next_due_mileage && log.next_due_date ? " หรือ " : ""}
            {log.next_due_date &&
              new Date(log.next_due_date).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
          </p>
        )}

        {log.notes && <p className="text-sm text-muted-foreground">{log.notes}</p>}

        {log.receipt_image_url && (
          <a
            href={log.receipt_image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            ดูใบเสร็จ
          </a>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/vehicles/${vehicleId}/maintenance/${log.id}/edit`}
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label={`แก้ไขบันทึก ${type?.name ?? ""}`}
        >
          <Pencil />
        </Link>
        <DeleteMaintenanceLogDialog
          logId={log.id}
          vehicleId={vehicleId}
          typeName={type?.name ?? "รายการนี้"}
        />
      </div>
    </div>
  );
}
