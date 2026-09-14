import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bike, FileText, Pencil, Plus, Wrench } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { DeleteVehicleDialog } from "@/components/vehicles/delete-vehicle-dialog";
import {
  MaintenanceLogItem,
  type MaintenanceLogWithType,
} from "@/components/maintenance/maintenance-log-item";
import { DocumentItem } from "@/components/documents/document-item";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", id).single();
  if (!vehicle) notFound();

  const { data: logs } = await supabase
    .from("maintenance_logs")
    .select("*, maintenance_types(name, icon, default_interval_km)")
    .eq("vehicle_id", id)
    .order("service_date", { ascending: false });

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("vehicle_id", id)
    .order("expiry_date", { ascending: true });

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
              <DeleteVehicleDialog vehicleId={vehicle.id} vehicleName={vehicle.name} />
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

      {logs && logs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {(logs as MaintenanceLogWithType[]).map((log) => (
            <MaintenanceLogItem
              key={log.id}
              log={log}
              vehicleId={vehicle.id}
              currentMileage={vehicle.current_mileage}
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

      {documents && documents.length > 0 ? (
        <div className="flex flex-col gap-3">
          {documents.map((document) => (
            <DocumentItem
              key={document.id}
              document={document}
              editHref={`/vehicles/${vehicle.id}/documents/${document.id}/edit`}
              revalidateTarget={`/vehicles/${vehicle.id}`}
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
