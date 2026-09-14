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
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        ยังไม่มีประวัติการซ่อมบำรุง
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2">
      {recent.map((log, index) => {
        const Icon = getMaintenanceIcon(log.maintenance_types?.icon ?? null);
        const isLast = index === recent.length - 1;
        return (
          <Link
            key={log.id}
            href={`/vehicles/${log.vehicle_id}`}
            className="relative flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
          >
            {!isLast && (
              <span aria-hidden className="absolute top-10 bottom-[-4px] left-[23px] w-px bg-border" />
            )}
            <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted ring-4 ring-card">
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
