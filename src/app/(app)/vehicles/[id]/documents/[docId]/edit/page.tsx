"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/ui/button";
import { VehicleDocumentForm } from "@/components/documents/vehicle-document-form";
import type { Document, Vehicle } from "@/types/database.types";

export default function EditVehicleDocumentPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = use(params);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "แก้ไขเอกสาร | Vehicle Maintenance Log";
  }, []);

  useEffect(() => {
    apiFetch<{ vehicle: Vehicle; documents: Document[] }>(`/api/vehicles/${id}`).then((result) => {
      if (result.error) {
        setError(result.error);
        return;
      }
      const found = result.data!.documents.find((d) => d.id === docId);
      if (!found) {
        setError("ไม่พบเอกสารนี้");
        return;
      }
      setVehicle(result.data!.vehicle);
      setDoc(found);
    });
  }, [id, docId]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">แก้ไขเอกสาร</h1>

      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Link href={`/vehicles/${id}`} className={buttonVariants()}>
            กลับไปหน้ารายละเอียดรถ
          </Link>
        </div>
      )}

      {!vehicle && !doc && !error && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {vehicle && doc && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <VehicleDocumentForm vehicleId={vehicle.id} document={doc} />
        </div>
      )}
    </div>
  );
}
