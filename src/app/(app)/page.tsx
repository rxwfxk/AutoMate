"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bike, Clock, Loader2, ReceiptText } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";
import { getDisplayName } from "@/lib/user-display";
import { buttonVariants } from "@/components/ui/button";
import { StatTile } from "@/components/dashboard/stat-tile";
import { SectionHeader } from "@/components/dashboard/section-header";
import { VehicleOverviewCard } from "@/components/dashboard/vehicle-overview-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { getDateFlagStatus, worseFlag, type FlagStatus } from "@/lib/flag-status";
import {
  aggregateMonthlyExpenses,
  aggregateYearlyExpenses,
  countActionableItems,
  getVehicleOverallStatus,
} from "@/lib/dashboard-data";
import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";
import type { Document, Vehicle } from "@/types/database.types";

type VehicleDetail = { vehicle: Vehicle; logs: MaintenanceLogWithType[]; documents: Document[] };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [logs, setLogs] = useState<MaintenanceLogWithType[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // No single "dashboard" endpoint by design — this composes the same
    // per-vehicle endpoints the Vehicles module already exposes (GET
    // /api/vehicles for the list, then GET /api/vehicles/[id] per vehicle
    // for its nested logs/documents), same as any external API consumer
    // would have to. Fine at the vehicle counts this app expects; a real
    // fleet-scale version would add a dedicated aggregate endpoint instead.
    apiFetch<Vehicle[]>("/api/vehicles").then(async (result) => {
      if (result.error) {
        setError(result.error);
        return;
      }
      const vehicleList = result.data!;
      setVehicles(vehicleList);
      if (vehicleList.length === 0) return;

      const details = await Promise.all(
        vehicleList.map((v) => apiFetch<VehicleDetail>(`/api/vehicles/${v.id}`)),
      );
      const failed = details.find((d) => d.error);
      if (failed) {
        setError(failed.error!);
        return;
      }
      setLogs(details.flatMap((d) => d.data!.logs));
      setDocuments(details.flatMap((d) => d.data!.documents));
    });
  }, []);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!vehicles) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-flag-green/10 text-flag-green">
            <Bike className="size-6" />
          </div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            ยินดีต้อนรับ, {getDisplayName(user)}
          </h1>
          <p className="text-sm text-muted-foreground">
            เริ่มต้นด้วยการเพิ่มมอเตอร์ไซค์ของคุณ เพื่อบันทึกและติดตามการดูแลรักษา
          </p>
          <Link href="/vehicles" className={buttonVariants({ className: "gap-1.5" })}>
            ไปที่รถของฉัน
            <ArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  const vehicleMileageById = new Map(vehicles.map((v) => [v.id, v.current_mileage]));
  const vehicleNameById = new Map(vehicles.map((v) => [v.id, v.name]));

  const actionableCount = countActionableItems(logs, vehicleMileageById, documents);
  const monthly = aggregateMonthlyExpenses(logs, documents, 12);
  const yearly = aggregateYearlyExpenses(logs, documents);
  const thisMonth = monthly[monthly.length - 1];
  const thisMonthTotal = thisMonth.maintenance + thisMonth.documents;

  const vehicleStatuses = vehicles
    .map((v) => getVehicleOverallStatus(v.id, v.current_mileage, logs, documents))
    .filter((s): s is FlagStatus => s !== null);
  const drivingLicense = documents.find((d) => d.document_type === "driving_license");
  const drivingLicenseStatus = drivingLicense ? getDateFlagStatus(drivingLicense.expiry_date) : null;
  const worstOverall = [...vehicleStatuses, drivingLicenseStatus]
    .filter((s): s is FlagStatus => s !== null)
    .reduce<FlagStatus>((acc, s) => worseFlag(acc, s), "green");
  const actionableTone = worstOverall === "red" ? "danger" : worstOverall === "yellow" ? "warning" : "default";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-foreground/[0.04]"
          style={{
            backgroundImage: "repeating-conic-gradient(currentColor 0% 25%, transparent 0% 50%)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Pit Wall</p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            ยินดีต้อนรับ, {getDisplayName(user)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            สรุปภาพรวมการดูแลรักษามอเตอร์ไซค์ของคุณ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile icon={Bike} label="รถทั้งหมด" value={String(vehicles.length)} unit="คัน" />
        <StatTile
          icon={AlertTriangle}
          label="ต้องดำเนินการ"
          value={String(actionableCount)}
          unit="รายการ"
          tone={actionableTone}
        />
        <StatTile
          icon={ReceiptText}
          label="ค่าใช้จ่ายเดือนนี้"
          value={thisMonthTotal.toLocaleString("th-TH")}
          unit="บาท"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <SectionHeader icon={Bike} title="รถของฉัน" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vehicles.map((vehicle) => (
              <VehicleOverviewCard
                key={vehicle.id}
                vehicle={vehicle}
                status={getVehicleOverallStatus(vehicle.id, vehicle.current_mileage, logs, documents)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SectionHeader icon={Clock} title="กิจกรรมล่าสุด" />
          <RecentActivity logs={logs} vehicleNameById={vehicleNameById} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader icon={ReceiptText} title="ค่าใช้จ่าย" />
        <ExpenseChart monthly={monthly} yearly={yearly} />
      </div>
    </div>
  );
}
