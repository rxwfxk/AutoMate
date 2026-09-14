import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleDocumentForm } from "@/components/documents/vehicle-document-form";

export const metadata: Metadata = {
  title: "เพิ่มเอกสาร | Vehicle Maintenance Log",
};

export default async function NewVehicleDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase.from("vehicles").select("id").eq("id", id).single();
  if (!vehicle) notFound();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">เพิ่มเอกสาร</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <VehicleDocumentForm vehicleId={vehicle.id} />
      </div>
    </div>
  );
}
