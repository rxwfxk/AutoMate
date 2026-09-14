import Link from "next/link";
import { getMaintenanceIcon } from "@/lib/maintenance-icons";
import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";

export function RecentActivity({
  logs,
  vehicleNameById,
}: {
  logs: MaintenanceLogWithType[];
  vehicleNameById: Map<string, string>;
}) {
  const recent = [...logs]
    .sort((a, b) => b.service_date.localeCompare(a.service_date))
    .slice(0, 8);

  if (recent.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        ยังไม่มีประวัติการซ่อมบำรุง
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
      {recent.map((log) => {
        const Icon = getMaintenanceIcon(log.maintenance_types?.icon ?? null);
        return (
          <Link
            key={log.id}
            href={`/vehicles/${log.vehicle_id}`}
            className="flex items-center gap-3 p-3 transition-colors hover:bg-accent"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {log.maintenance_types?.name ?? "ไม่ระบุประเภท"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {vehicleNameById.get(log.vehicle_id) ?? "รถ"}
                {" · "}
                {new Date(log.service_date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            {log.cost !== null && (
              <p className="shrink-0 text-sm">
                <span className="font-sans">฿ </span>
                <span className="font-mono">{log.cost.toLocaleString("th-TH")}</span>
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
