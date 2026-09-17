"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { DrivingLicenseForm } from "@/components/documents/driving-license-form";
import type { Document } from "@/types/database.types";

export default function DrivingLicensePage() {
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
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        {drivingLicense ? "แก้ไขใบขับขี่" : "เพิ่มใบขับขี่"}
      </h1>

      {drivingLicense === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <DrivingLicenseForm document={drivingLicense ?? undefined} />
        </div>
      )}
    </div>
  );
}
