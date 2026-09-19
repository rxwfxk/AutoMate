"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { PageHeader, Breadcrumb } from "@/components/redesign/page-header";
import { DrivingLicenseForm } from "@/components/documents/driving-license-form";
import type { Document } from "@/types/database.types";

export default function DrivingLicensePage() {
  const router = useRouter();
  const [drivingLicense, setDrivingLicense] = useState<Document | null | undefined>(undefined);

  useEffect(() => {
    apiFetch<{ document: Document | null }>("/api/driving-license").then((result) => {
      setDrivingLicense(result.error ? null : result.data!.document);
    });
  }, []);

  useEffect(() => {
    if (drivingLicense !== undefined) {
      document.title = `${drivingLicense ? "แก้ไข" : "เพิ่ม"}ใบขับขี่ | Vehicle Maintenance Log`;
    }
  }, [drivingLicense]);

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
          <h1 className="text-lg font-extrabold text-ink">
            {drivingLicense ? "แก้ไขใบขับขี่" : "เพิ่มใบขับขี่"}
          </h1>
        </div>

        {drivingLicense === undefined ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <DrivingLicenseForm document={drivingLicense ?? undefined} />
        )}
      </div>

      {/* Desktop layout — see vehicles/new/page.tsx for why this is just a
          widened version of the same form rather than a bespoke screen. */}
      <div className="hidden w-full max-w-2xl flex-col gap-5 lg:flex">
        <PageHeader
          eyebrow={<Breadcrumb items={["โปรไฟล์", drivingLicense ? "แก้ไขใบขับขี่" : "เพิ่มใบขับขี่"]} />}
          title={drivingLicense ? "แก้ไขใบขับขี่" : "เพิ่มใบขับขี่"}
        />

        {drivingLicense === undefined ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <div className="rounded-card bg-surface-card p-6.5">
            <DrivingLicenseForm document={drivingLicense ?? undefined} />
          </div>
        )}
      </div>
    </div>
  );
}
