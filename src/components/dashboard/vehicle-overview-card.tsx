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
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-video w-full bg-muted">
        {vehicle.image_url ? (
          <Image
            src={vehicle.image_url}
            alt={vehicle.name}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Bike className="size-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {status ? (
            <FlagBadge status={status} className="bg-card/90 backdrop-blur-sm" />
          ) : (
            <span className="rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              ยังไม่มีข้อมูล
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 p-3.5">
        <p className="truncate font-heading font-semibold leading-tight">{vehicle.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {vehicle.brand} {vehicle.model}
        </p>
        <p className="mt-1 font-mono text-lg font-bold">
          {vehicle.current_mileage.toLocaleString("th-TH")}{" "}
          <span className="text-xs font-normal text-muted-foreground">กม.</span>
        </p>
      </div>
    </Link>
  );
}
