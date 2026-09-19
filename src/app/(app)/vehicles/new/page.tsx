"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { PageHeader, Breadcrumb } from "@/components/redesign/page-header";

export default function NewVehiclePage() {
  const router = useRouter();

  useEffect(() => {
    document.title = "เพิ่มรถ | Vehicle Maintenance Log";
  }, []);

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
          <h1 className="text-lg font-extrabold text-ink">เพิ่มรถใหม่</h1>
        </div>
        <VehicleForm />
      </div>

      {/* Desktop layout — not in the design handoff ("ยังไม่ได้ออกแบบ"), so
          this just widens the same form per the project's "ทำตามระบบเดียวกัน"
          call rather than building a bespoke 2-column screen for it. */}
      <div className="hidden w-full max-w-2xl flex-col gap-5 lg:flex">
        <PageHeader eyebrow={<Breadcrumb items={["รถของฉัน", "เพิ่มรถ"]} />} title="เพิ่มรถใหม่" />
        <div className="rounded-card bg-surface-card p-6.5">
          <VehicleForm />
        </div>
      </div>
    </div>
  );
}
