import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MaintenanceLogForm } from "@/components/maintenance/maintenance-log-form";

export const metadata: Metadata = {
  title: "เพิ่มบันทึกซ่อมบำรุง | Vehicle Maintenance Log",
};

export default async function NewMaintenanceLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, current_mileage")
    .eq("id", id)
    .single();
  if (!vehicle) notFound();

  const { data: maintenanceTypes } = await supabase
    .from("maintenance_types")
    .select("*")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">เพิ่มบันทึกซ่อมบำรุง</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <MaintenanceLogForm
          vehicleId={vehicle.id}
          maintenanceTypes={maintenanceTypes ?? []}
          defaultMileage={vehicle.current_mileage}
        />
      </div>
    </div>
  );
}
