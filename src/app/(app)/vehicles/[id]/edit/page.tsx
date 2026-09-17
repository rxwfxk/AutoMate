"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/ui/button";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import type { Vehicle } from "@/types/database.types";

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "แก้ไขรถ | Vehicle Maintenance Log";
  }, []);

  useEffect(() => {
    apiFetch<{ vehicle: Vehicle }>(`/api/vehicles/${id}`).then((result) => {
      if (result.error) setError(result.error);
      else setVehicle(result.data!.vehicle);
    });
  }, [id]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">แก้ไขข้อมูลรถ</h1>

      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Link href="/vehicles" className={buttonVariants()}>
            กลับไปหน้ารถของฉัน
          </Link>
        </div>
      )}

      {!vehicle && !error && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {vehicle && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <VehicleForm vehicle={vehicle} />
        </div>
      )}
    </div>
  );
}
