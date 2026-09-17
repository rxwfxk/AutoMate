"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/ui/button";
import { MaintenanceLogForm } from "@/components/maintenance/maintenance-log-form";
import type { MaintenanceLog, MaintenanceType, Vehicle } from "@/types/database.types";

export default function EditMaintenanceLogPage({
  params,
}: {
  params: Promise<{ id: string; logId: string }>;
}) {
  const { id, logId } = use(params);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [log, setLog] = useState<MaintenanceLog | null>(null);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "แก้ไขบันทึกซ่อมบำรุง | Vehicle Maintenance Log";
  }, []);

  useEffect(() => {
    Promise.all([
      apiFetch<{ vehicle: Vehicle; logs: MaintenanceLog[] }>(`/api/vehicles/${id}`),
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
      const foundLog = vehicleResult.data!.logs.find((l) => l.id === logId);
      if (!foundLog) {
        setError("ไม่พบบันทึกนี้");
        return;
      }
      setVehicle(vehicleResult.data!.vehicle);
      setLog(foundLog);
      setMaintenanceTypes(typesResult.data!);
    });
  }, [id, logId]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">แก้ไขบันทึกซ่อมบำรุง</h1>

      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Link href={`/vehicles/${id}`} className={buttonVariants()}>
            กลับไปหน้ารายละเอียดรถ
          </Link>
        </div>
      )}

      {!vehicle && !log && !maintenanceTypes && !error && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {vehicle && log && maintenanceTypes && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <MaintenanceLogForm
            vehicleId={vehicle.id}
            maintenanceTypes={maintenanceTypes}
            defaultMileage={vehicle.current_mileage}
            log={log}
          />
        </div>
      )}
    </div>
  );
}
