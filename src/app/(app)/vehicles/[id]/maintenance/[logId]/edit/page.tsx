"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/redesign/button";
import { PageHeader, Breadcrumb } from "@/components/redesign/page-header";
import { MaintenanceLogForm } from "@/components/maintenance/maintenance-log-form";
import type { MaintenanceLog, MaintenanceType, Vehicle } from "@/types/database.types";

export default function EditMaintenanceLogPage({
  params,
}: {
  params: Promise<{ id: string; logId: string }>;
}) {
  const { id, logId } = use(params);
  const router = useRouter();
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
    <div className="flex w-full flex-1 flex-col items-center bg-base p-5 lg:p-8">
      <div className="flex w-full max-w-xl flex-col gap-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="ย้อนกลับ"
            className="flex size-9.5 shrink-0 items-center justify-center rounded-icon border-[1.5px] border-line-strong text-ink"
          >
            <ArrowLeft className="size-4.5" />
          </button>
          <h1 className="text-lg font-extrabold text-ink">แก้ไขบันทึกซ่อมบำรุง</h1>
        </div>

        {error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-ink-muted">{error}</p>
            <Link href={`/vehicles/${id}`} className={buttonVariants({ variant: "dark" })}>
              กลับไปหน้ารายละเอียดรถ
            </Link>
          </div>
        )}

        {!vehicle && !log && !maintenanceTypes && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        )}

        {vehicle && log && maintenanceTypes && (
          <MaintenanceLogForm
            vehicleId={vehicle.id}
            maintenanceTypes={maintenanceTypes}
            defaultMileage={vehicle.current_mileage}
            log={log}
          />
        )}
      </div>

      {/* Desktop layout — same widened-form treatment as the other edit pages
          (see vehicles/new/page.tsx): reuses the one MaintenanceLogForm. */}
      <div className="hidden w-full max-w-2xl flex-col gap-5 lg:flex">
        <PageHeader
          eyebrow={<Breadcrumb items={["รถของฉัน", vehicle?.name ?? "…", "แก้ไขบันทึก"]} />}
          title="แก้ไขบันทึกซ่อมบำรุง"
        />

        {error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-ink-muted">{error}</p>
            <Link href={`/vehicles/${id}`} className={buttonVariants({ variant: "dark" })}>
              กลับไปหน้ารายละเอียดรถ
            </Link>
          </div>
        )}

        {!vehicle && !log && !maintenanceTypes && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        )}

        {vehicle && log && maintenanceTypes && (
          <div className="rounded-card bg-surface-card p-6.5">
            <MaintenanceLogForm
              vehicleId={vehicle.id}
              maintenanceTypes={maintenanceTypes}
              defaultMileage={vehicle.current_mileage}
              log={log}
            />
          </div>
        )}
      </div>
    </div>
  );
}
