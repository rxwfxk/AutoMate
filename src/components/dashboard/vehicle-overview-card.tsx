import Image from "next/image";
import Link from "next/link";
import { Bike } from "lucide-react";

import type { FlagStatus } from "@/lib/flag-status";
import { FlagBadge } from "@/components/ui/flag-badge";
import type { Vehicle } from "@/types/database.types";

export function VehicleOverviewCard({
  vehicle,
  status,
}: {
  vehicle: Vehicle;
  status: FlagStatus | null;
}) {
  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {vehicle.image_url ? (
          <Image src={vehicle.image_url} alt={vehicle.name} fill sizes="56px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Bike className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{vehicle.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {vehicle.brand} {vehicle.model}
        </p>
        <p className="font-mono text-sm">
          {vehicle.current_mileage.toLocaleString("th-TH")}{" "}
          <span className="text-xs font-normal text-muted-foreground">กม.</span>
        </p>
      </div>

      {status ? (
        <FlagBadge status={status} className="shrink-0" />
      ) : (
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          ยังไม่มีข้อมูล
        </span>
      )}
    </Link>
  );
}
