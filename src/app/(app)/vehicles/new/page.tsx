import type { Metadata } from "next";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export const metadata: Metadata = {
  title: "เพิ่มรถ | Vehicle Maintenance Log",
};

export default function NewVehiclePage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">เพิ่มรถใหม่</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <VehicleForm />
      </div>
    </div>
  );
}
