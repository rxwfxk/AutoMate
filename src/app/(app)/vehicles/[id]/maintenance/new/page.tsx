"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/ui/button";
import { MaintenanceLogForm } from "@/components/maintenance/maintenance-log-form";
import type { MaintenanceType, Vehicle } from "@/types/database.types";

export default function NewMaintenanceLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "เพิ่มบันทึกซ่อมบำรุง | Vehicle Maintenance Log";
  }, []);

  useEffect(() => {
    Promise.all([
      apiFetch<{ vehicle: Vehicle }>(`/api/vehicles/${id}`),
      apiFetch<MaintenanceType[]>("/api/maintenance-types"),
    ]).then(([vehicleResult, typesResult]) => {
      if (vehicleResult.error) {
        setError(vehicleResult.error);
        return;
      }
      if (typesResult.error) {
        setError(typesResult.error);
        return;
      }
      setVehicle(vehicleResult.data!.vehicle);
      setMaintenanceTypes(typesResult.data!);
    });
  }, [id]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">เพิ่มบันทึกซ่อมบำรุง</h1>

      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Link href="/vehicles" className={buttonVariants()}>
            กลับไปหน้ารถของฉัน
          </Link>
        </div>
      )}

      {!vehicle && !maintenanceTypes && !error && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {vehicle && maintenanceTypes && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <MaintenanceLogForm
            vehicleId={vehicle.id}
            maintenanceTypes={maintenanceTypes}
            defaultMileage={vehicle.current_mileage}
          />
        </div>
      )}
    </div>
  );
}
