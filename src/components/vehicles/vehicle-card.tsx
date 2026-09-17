import Image from "next/image";
import Link from "next/link";
import { Bike, Pencil } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DeleteVehicleDialog } from "@/components/vehicles/delete-vehicle-dialog";
import type { Vehicle } from "@/types/database.types";

export function VehicleCard({
  vehicle,
  onDeleted,
}: {
  vehicle: Vehicle;
  onDeleted?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Link href={`/vehicles/${vehicle.id}`} className="relative aspect-video w-full bg-muted">
        {vehicle.image_url ? (
          <Image
            src={vehicle.image_url}
            alt={vehicle.name}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Bike className="size-10 text-muted-foreground" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/vehicles/${vehicle.id}`} className="min-w-0">
            <h3 className="truncate font-heading font-semibold leading-tight hover:underline">
              {vehicle.name}
            </h3>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={`แก้ไข ${vehicle.name}`}
            >
              <Pencil />
            </Link>
            <DeleteVehicleDialog
              vehicleId={vehicle.id}
              vehicleName={vehicle.name}
              onDeleted={onDeleted}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {vehicle.brand} {vehicle.model}
          {vehicle.year ? ` · ${vehicle.year}` : ""}
        </p>

        {vehicle.license_plate && (
          <p className="text-sm text-muted-foreground">ทะเบียน: {vehicle.license_plate}</p>
        )}

        <p className="mt-2 font-mono text-lg font-semibold">
          {vehicle.current_mileage.toLocaleString("th-TH")}{" "}
          <span className="text-sm font-normal text-muted-foreground">กม.</span>
        </p>
      </div>
    </div>
  );
}
