import Link from "next/link";
import { Pencil } from "lucide-react";

import { Card } from "@/components/redesign/card";
import { PlaceholderImage } from "@/components/redesign/placeholder-image";
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
    <Card size="main" className="flex flex-col overflow-hidden p-0">
      <Link href={`/vehicles/${vehicle.id}`} className="block">
        <PlaceholderImage
          src={vehicle.image_url}
          alt={vehicle.name}
          className="aspect-video w-full"
          sizes="(min-width: 640px) 33vw, 100vw"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/vehicles/${vehicle.id}`} className="min-w-0">
            <h3 className="truncate text-base font-extrabold text-ink hover:underline">{vehicle.name}</h3>
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              aria-label={`แก้ไข ${vehicle.name}`}
              className="flex size-8 items-center justify-center rounded-icon text-ink-muted hover:bg-base"
            >
              <Pencil className="size-4" />
            </Link>
            <DeleteVehicleDialog
              vehicleId={vehicle.id}
              vehicleName={vehicle.name}
              onDeleted={onDeleted}
            />
          </div>
        </div>

        <p className="text-sm text-ink-muted">
          {vehicle.brand} {vehicle.model}
          {vehicle.year ? ` · ${vehicle.year}` : ""}
        </p>

        {vehicle.license_plate && (
          <p className="font-mono text-sm text-ink-3">{vehicle.license_plate}</p>
        )}

        <p className="mt-2 font-mono text-lg font-bold text-ink">
          {vehicle.current_mileage.toLocaleString("th-TH")}{" "}
          <span className="text-sm font-normal text-ink-muted">กม.</span>
        </p>
      </div>
    </Card>
  );
}
