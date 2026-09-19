"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/redesign/button";
import { PageHeader, Breadcrumb } from "@/components/redesign/page-header";
import { MaintenanceLogForm } from "@/components/maintenance/maintenance-log-form";
import { MaintenanceLogFormDesktop } from "@/components/maintenance/maintenance-log-form-desktop";
import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";
import type { MaintenanceType, Vehicle } from "@/types/database.types";

export default function NewMaintenanceLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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

  // Desktop-only: the mobile form above doesn't need this vehicle's log
  // history, but the 3c right column ("ครั้งล่าสุดของงานนี้") does — fetch it
  // separately instead of widening the effect above.
  const [previousLogs, setPreviousLogs] = useState<MaintenanceLogWithType[] | null>(null);

  useEffect(() => {
    apiFetch<{ logs: MaintenanceLogWithType[] }>(`/api/vehicles/${id}`).then((result) => {
      if (!result.error) setPreviousLogs(result.data!.logs);
    });
  }, [id]);

  return (
    <div className="flex w-full flex-1 flex-col items-center bg-base p-5 lg:p-8">
      {/* Mobile/tablet layout — untouched below this line except lg:hidden. */}
      <div className="flex w-full flex-1 flex-col items-center lg:hidden">
        <div className="flex w-full max-w-xl flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="ย้อนกลับ"
              className="flex size-9.5 shrink-0 items-center justify-center rounded-icon border-[1.5px] border-line-strong text-ink"
            >
              <ArrowLeft className="size-4.5" />
            </button>
            <h1 className="text-lg font-extrabold text-ink">เพิ่มบันทึกซ่อมบำรุง</h1>
          </div>

          {error && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-ink-muted">{error}</p>
              <Link href="/vehicles" className={buttonVariants({ variant: "dark" })}>
                กลับไปหน้ารถของฉัน
              </Link>
            </div>
          )}

          {!vehicle && !maintenanceTypes && !error && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-ink-muted" />
            </div>
          )}

          {vehicle && maintenanceTypes && (
            <MaintenanceLogForm
              vehicleId={vehicle.id}
              maintenanceTypes={maintenanceTypes}
              defaultMileage={vehicle.current_mileage}
            />
          )}
        </div>
      </div>

      {/* Desktop layout — README Screen 3c. */}
      <div className="hidden w-full flex-col gap-5 lg:flex">
        <PageHeader
          eyebrow={vehicle ? <Breadcrumb items={["รถของฉัน", vehicle.name, "เพิ่มบันทึก"]} /> : undefined}
          title="เพิ่มบันทึกซ่อมบำรุง"
        />

        {error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-ink-muted">{error}</p>
            <Link href="/vehicles" className={buttonVariants({ variant: "dark" })}>
              กลับไปหน้ารถของฉัน
            </Link>
          </div>
        )}

        {!vehicle && !maintenanceTypes && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        )}

        {vehicle && maintenanceTypes && (
          <MaintenanceLogFormDesktop
            vehicleId={vehicle.id}
            vehicleName={vehicle.name}
            maintenanceTypes={maintenanceTypes}
            defaultMileage={vehicle.current_mileage}
            previousLogs={previousLogs ?? []}
          />
        )}
      </div>
    </div>
  );
}
