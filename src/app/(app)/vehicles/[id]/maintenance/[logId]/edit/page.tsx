import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MaintenanceLogForm } from "@/components/maintenance/maintenance-log-form";

export const metadata: Metadata = {
  title: "แก้ไขบันทึกซ่อมบำรุง | Vehicle Maintenance Log",
};

export default async function EditMaintenanceLogPage({
  params,
}: {
  params: Promise<{ id: string; logId: string }>;
}) {
  const { id, logId } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, current_mileage")
    .eq("id", id)
    .single();
  if (!vehicle) notFound();

  const { data: log } = await supabase
    .from("maintenance_logs")
    .select("*")
    .eq("id", logId)
    .eq("vehicle_id", id)
    .single();
  if (!log) notFound();

  const { data: maintenanceTypes } = await supabase
    .from("maintenance_types")
    .select("*")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">แก้ไขบันทึกซ่อมบำรุง</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <MaintenanceLogForm
          vehicleId={vehicle.id}
          maintenanceTypes={maintenanceTypes ?? []}
          defaultMileage={vehicle.current_mileage}
          log={log}
        />
      </div>
    </div>
  );
}
