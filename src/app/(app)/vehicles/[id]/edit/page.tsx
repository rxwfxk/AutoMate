"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/redesign/button";
import { PageHeader, Breadcrumb } from "@/components/redesign/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import type { Vehicle } from "@/types/database.types";

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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
          <h1 className="text-lg font-extrabold text-ink">แก้ไขข้อมูลรถ</h1>
        </div>

        {error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-ink-muted">{error}</p>
            <Link href="/vehicles" className={buttonVariants({ variant: "dark" })}>
              กลับไปหน้ารถของฉัน
            </Link>
          </div>
        )}

        {!vehicle && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        )}

        {vehicle && <VehicleForm vehicle={vehicle} />}
      </div>

      {/* Desktop layout — see vehicles/new/page.tsx for why this is just a
          widened version of the same form rather than a bespoke screen. */}
      <div className="hidden w-full max-w-2xl flex-col gap-5 lg:flex">
        <PageHeader
          eyebrow={<Breadcrumb items={["รถของฉัน", vehicle?.name ?? "…", "แก้ไข"]} />}
          title="แก้ไขข้อมูลรถ"
        />

        {error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-ink-muted">{error}</p>
            <Link href="/vehicles" className={buttonVariants({ variant: "dark" })}>
              กลับไปหน้ารถของฉัน
            </Link>
          </div>
        )}

        {!vehicle && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        )}

        {vehicle && (
          <div className="rounded-card bg-surface-card p-6.5">
            <VehicleForm vehicle={vehicle} />
          </div>
        )}
      </div>
    </div>
  );
}
