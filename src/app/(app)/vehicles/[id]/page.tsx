"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, FileText, Loader2, Pencil, Plus, Wrench } from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/ui/button";
import { DeleteVehicleDialog } from "@/components/vehicles/delete-vehicle-dialog";
import {
  MaintenanceLogItem,
  type MaintenanceLogWithType,
} from "@/components/maintenance/maintenance-log-item";
import { DocumentItem } from "@/components/documents/document-item";
import type { Document, Vehicle } from "@/types/database.types";

type VehicleDetailResponse = {
  vehicle: Vehicle;
  logs: MaintenanceLogWithType[];
  documents: Document[];
};

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<VehicleDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<VehicleDetailResponse>(`/api/vehicles/${id}`).then((res) => {
      if (res.error) setError(res.error);
      else setResult(res.data!);
    });
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 p-4 text-center sm:p-6">
        <p className="text-muted-foreground">{error}</p>
        <Link href="/vehicles" className={buttonVariants()}>
          กลับไปหน้ารถของฉัน
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { vehicle, logs, documents } = result;

  function handleLogDeleted(logId: string) {
    setResult((prev) => (prev ? { ...prev, logs: prev.logs.filter((l) => l.id !== logId) } : prev));
  }

  function handleDocumentDeleted(docId: string) {
    setResult((prev) =>
      prev ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) } : prev,
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm sm:flex-row">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-48">
          {vehicle.image_url ? (
            <Image
              src={vehicle.image_url}
              alt={vehicle.name}
              fill
              sizes="192px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Bike className="size-10 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-heading text-xl font-semibold tracking-tight">{vehicle.name}</h1>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={`/vehicles/${vehicle.id}/edit`}
                className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                aria-label={`แก้ไข ${vehicle.name}`}
              >
                <Pencil />
              </Link>
              <DeleteVehicleDialog
                vehicleId={vehicle.id}
                vehicleName={vehicle.name}
                onDeleted={() => router.push("/vehicles")}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {vehicle.brand} {vehicle.model}
            {vehicle.year ? ` · ${vehicle.year}` : ""}
          </p>
          {vehicle.license_plate && (
            <p className="text-sm text-muted-foreground">ทะเบียน: {vehicle.license_plate}</p>
          )}
          <p className="mt-2 font-mono text-2xl font-semibold">
            {vehicle.current_mileage.toLocaleString("th-TH")}{" "}
            <span className="text-sm font-normal text-muted-foreground">กม.</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold tracking-tight">ประวัติการซ่อมบำรุง</h2>
        <Link
          href={`/vehicles/${vehicle.id}/maintenance/new`}
          className={buttonVariants({ className: "gap-1.5" })}
        >
          <Plus />
          เพิ่มบันทึก
        </Link>
      </div>

      {logs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <MaintenanceLogItem
              key={log.id}
              log={log}
              vehicleId={vehicle.id}
              currentMileage={vehicle.current_mileage}
              onDeleted={handleLogDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Wrench className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">ยังไม่มีประวัติการซ่อมบำรุง</p>
          <Link
            href={`/vehicles/${vehicle.id}/maintenance/new`}
            className={buttonVariants({ className: "gap-1.5" })}
          >
            <Plus />
            เพิ่มบันทึกแรก
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold tracking-tight">เอกสาร</h2>
        <Link
          href={`/vehicles/${vehicle.id}/documents/new`}
          className={buttonVariants({ className: "gap-1.5" })}
        >
          <Plus />
          เพิ่มเอกสาร
        </Link>
      </div>

      {documents.length > 0 ? (
        <div className="flex flex-col gap-3">
          {documents.map((document) => (
            <DocumentItem
              key={document.id}
              document={document}
              editHref={`/vehicles/${vehicle.id}/documents/${document.id}/edit`}
              deleteUrl={`/api/vehicles/${vehicle.id}/documents/${document.id}`}
              onDeleted={handleDocumentDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">ยังไม่มีเอกสาร (พ.ร.บ., ประกัน, ภาษี)</p>
          <Link
            href={`/vehicles/${vehicle.id}/documents/new`}
            className={buttonVariants({ className: "gap-1.5" })}
          >
            <Plus />
            เพิ่มเอกสารแรก
          </Link>
        </div>
      )}
    </div>
  );
}
