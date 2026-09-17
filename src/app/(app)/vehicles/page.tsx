"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Bike } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import type { Vehicle } from "@/types/database.types";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Vehicle[]>("/api/vehicles").then((result) => {
      if (result.error) setError(result.error);
      else setVehicles(result.data ?? []);
    });
  }, []);

  function handleDeleted(id: string) {
    setVehicles((prev) => prev?.filter((v) => v.id !== id) ?? prev);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold tracking-tight">รถของฉัน</h1>
        <Link href="/vehicles/new" className={buttonVariants({ className: "gap-1.5" })}>
          <Plus />
          เพิ่มรถ
        </Link>
      </div>

      {error && <p className="text-sm text-flag-red">{error}</p>}

      {vehicles === null && !error && (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {vehicles && vehicles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      {vehicles && vehicles.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Bike className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">ยังไม่มีรถในระบบ</p>
          <Link href="/vehicles/new" className={buttonVariants({ className: "gap-1.5" })}>
            <Plus />
            เพิ่มรถคันแรก
          </Link>
        </div>
      )}
    </div>
  );
}
