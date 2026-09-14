import Link from "next/link";
import { AlertTriangle, ArrowRight, Bike, Clock, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (!vehicles || vehicles.length === 0) {
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

  const { data: logsData } = await supabase
    .from("maintenance_logs")
    .select("*, maintenance_types(name, icon, default_interval_km)")
    .order("service_date", { ascending: false });
  const logs = (logsData ?? []) as MaintenanceLogWithType[];

  const { data: documentsData } = await supabase.from("documents").select("*");
  const documents = documentsData ?? [];

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
