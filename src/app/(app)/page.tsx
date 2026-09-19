"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "cn";

import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";
import { getAvatarUrl, getDisplayName } from "@/lib/user-display";
import { buttonVariants } from "@/components/redesign/button";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { StatTile } from "@/components/redesign/stat-tile";
import { PageHeader } from "@/components/redesign/page-header";
import { StatusDot, StatusBadge } from "@/components/redesign/status";
import { PlaceholderImage } from "@/components/redesign/placeholder-image";
import { getMaintenanceIcon } from "@/lib/maintenance-icons";
import { currentDocuments, currentLogs } from "@/lib/current-items";
import { getDateFlagStatus, getMaintenanceFlagStatus, worseFlag, type FlagStatus } from "@/lib/flag-status";
import {
  aggregateMonthlyExpenses,
  aggregateYearlyExpenses,
  countActionableItems,
  getMostUrgentItem,
  getRecentActivity,
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
      <div className="flex flex-1 items-center justify-center bg-base p-6 text-center">
        <p className="text-ink-muted">{error}</p>
      </div>
    );
  }

  if (!vehicles) {
    return (
      <div className="flex flex-1 items-center justify-center bg-base py-16">
        <Loader2 className="size-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-base p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-card bg-surface-card p-8 text-center shadow-card">
          <div className="flex size-12 items-center justify-center rounded-icon bg-cta-soft text-cta">
            <Bike className="size-6" />
          </div>
          <h1 className="text-xl font-extrabold text-ink">
            ยินดีต้อนรับ, {getDisplayName(user)}
          </h1>
          <p className="text-sm text-ink-muted">
            เริ่มต้นด้วยการเพิ่มมอเตอร์ไซค์ของคุณ เพื่อบันทึกและติดตามการดูแลรักษา
          </p>
          <Link href="/vehicles" className={buttonVariants({ className: "gap-1.5" })}>
            ไปที่รถของฉัน
            <ArrowRight className="size-4" />
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
  // NOTE: `documents` here only ever contains vehicle-scoped rows (this page
  // composes per-vehicle GET /api/vehicles/[id] responses, which filter
  // `.eq("vehicle_id", id)") — the driving license (vehicle_id null) never
  // shows up, so this lookup is always empty. Pre-existing gap, not
  // introduced by this pass; left as-is since fetching it is a data-layer
  // change, not a visual one.
  const drivingLicense = documents.find((d) => d.document_type === "driving_license");
  const drivingLicenseStatus = drivingLicense ? getDateFlagStatus(drivingLicense.expiry_date) : null;
  const worstOverall = [...vehicleStatuses, drivingLicenseStatus]
    .filter((s): s is FlagStatus => s !== null)
    .reduce<FlagStatus>((acc, s) => worseFlag(acc, s), "green");
  const urgentItem = getMostUrgentItem(logs, documents, vehicleMileageById, vehicleNameById);
  const avatarUrl = getAvatarUrl(user);
  const recentActivity = getRecentActivity(logs, 8);

  // Per-item statuses across every log + document, for the "ต้องดำเนินการ"
  // stat tile's red/yellow breakdown (countActionableItems only gives the
  // combined non-green count).
  const itemStatuses = [
    ...currentLogs(logs).map((log) =>
      getMaintenanceFlagStatus({
        nextDueDate: log.next_due_date,
        nextDueMileage: log.next_due_mileage,
        currentMileage: vehicleMileageById.get(log.vehicle_id) ?? 0,
        intervalKm: log.maintenance_types?.default_interval_km,
      }),
    ),
    ...currentDocuments(documents).map((doc) => getDateFlagStatus(doc.expiry_date)),
  ];
  const redCount = itemStatuses.filter((s) => s === "red").length;
  const yellowCount = itemStatuses.filter((s) => s === "yellow").length;

  return (
    <>
      {/* Mobile dashboard — design_handoff_automate_redesign/README.md Screen 1.
          No 12-month chart here by design (desktop-only per the handoff). */}
      <div className="flex flex-1 flex-col gap-4 bg-base p-5 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-ink-muted">แดชบอร์ด</p>
            <h1 className="truncate text-lg font-extrabold text-ink">สวัสดี {getDisplayName(user)}</h1>
          </div>
          <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-icon bg-ink text-sm font-extrabold text-surface">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="40px" className="object-cover" />
            ) : (
              getDisplayName(user).charAt(0)
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <StatTile label="รถของฉัน" value={vehicles.length} />
          <StatTile
            label="ต้องทำ"
            value={actionableCount}
            tone={actionableCount > 0 ? "alert" : "default"}
          />
          <StatTile
            label="เดือนนี้"
            value={
              <>
                <span className="font-sans text-base">฿ </span>
                {thisMonthTotal.toLocaleString("th-TH")}
              </>
            }
          />
        </div>

        {worstOverall === "green" ? (
          <div className="rounded-card bg-ink p-5.5 text-center">
            <p className="font-bold text-surface">ทุกอย่างเรียบร้อย</p>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-card p-5.5",
              worstOverall === "red" ? "bg-flag-overdue text-surface" : "bg-flag-due-soon text-ink",
            )}
          >
            <p className="font-mono text-xs tracking-[0.12em] uppercase opacity-90">
              {worstOverall === "red" ? "เลยกำหนดแล้ว" : "ใกล้ครบกำหนด"}
            </p>
            {urgentItem?.vehicleName && (
              <span
                className={cn(
                  "mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold",
                  worstOverall === "red" ? "bg-surface/20" : "bg-ink/10",
                )}
              >
                {urgentItem.vehicleName}
              </span>
            )}
            <h2 className="mt-2 text-[27px] leading-tight font-extrabold">{urgentItem?.title}</h2>
            <div className="mt-3 flex gap-5">
              {urgentItem?.dueMileage != null && (
                <div>
                  <p className="text-xs font-semibold opacity-80">ครบกำหนด</p>
                  <p className="font-mono text-[19px]">
                    {urgentItem.dueMileage.toLocaleString("th-TH")} กม.
                  </p>
                </div>
              )}
              {urgentItem?.dueDate && (
                <div>
                  <p className="text-xs font-semibold opacity-80">วันที่</p>
                  <p className="font-mono text-[19px]">
                    {new Date(urgentItem.dueDate).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
            <Link
              href={urgentItem?.href ?? "/vehicles"}
              className={cn(
                "mt-4 flex items-center justify-center rounded-button p-4 text-base font-extrabold",
                worstOverall === "red" ? "bg-surface text-ink" : "bg-ink text-surface",
              )}
            >
              บันทึกการซ่อมบำรุง
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold text-ink">รถของฉัน</h2>
          <Link href="/vehicles" className="text-sm font-bold text-cta">
            ดูทั้งหมด
          </Link>
        </div>
        <div className="flex gap-3">
          {vehicles.slice(0, 2).map((vehicle) => {
            const status = getVehicleOverallStatus(vehicle.id, vehicle.current_mileage, logs, documents);
            return (
              <Link
                key={vehicle.id}
                href={`/vehicles/${vehicle.id}`}
                className="min-w-0 flex-1 overflow-hidden rounded-list bg-surface-card"
              >
                <div className="relative h-18.5">
                  <PlaceholderImage
                    src={vehicle.image_url}
                    alt={vehicle.name}
                    className="size-full"
                    sizes="50vw"
                  />
                  {status && (
                    <StatusDot
                      status={status}
                      className="absolute top-2 right-2 size-3 border-2 border-surface-card"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-[15px] font-extrabold text-ink">{vehicle.name}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <p className="mt-0.5 font-mono text-[13px] text-ink-3">
                    {vehicle.current_mileage.toLocaleString("th-TH")} กม.
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop dashboard — design_handoff_automate_redesign/README.md Screen 6. */}
      <div className="hidden flex-1 flex-col gap-5.5 bg-base px-8 py-7 lg:flex">
        <PageHeader
          eyebrow={
            <p className="text-sm font-bold text-ink-muted">
              {new Date().toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          }
          title={`สวัสดี ${getDisplayName(user)}`}
          actions={
            <>
              <Link
                href="/vehicles"
                className="flex items-center rounded-[16px] border-[1.5px] border-line-strong px-4.5 py-3.25 text-[15px] font-extrabold text-ink"
              >
                อัปเดตเลขไมล์
              </Link>
              <Link
                href="/vehicles"
                className="flex items-center rounded-[16px] bg-cta px-5 py-3.25 text-[15px] font-extrabold text-surface"
              >
                + เพิ่มบันทึก
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-[1.35fr_1fr] gap-5">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3.5">
              <StatTile label="รถทั้งหมด" value={vehicles.length} />
              <StatTile
                label="ต้องดำเนินการ"
                value={actionableCount}
                tone={actionableCount > 0 ? "alert" : "default"}
                sublabel={
                  actionableCount > 0
                    ? [redCount && `🔴 ${redCount}`, yellowCount && `🟡 ${yellowCount}`]
                        .filter(Boolean)
                        .join(" · ")
                    : undefined
                }
              />
              <StatTile
                label="ค่าใช้จ่ายเดือนนี้"
                value={
                  <>
                    <span className="font-sans text-lg">฿ </span>
                    {thisMonthTotal.toLocaleString("th-TH")}
                  </>
                }
                sublabel={`ซ่อมบำรุง ${thisMonth.maintenance.toLocaleString("th-TH")} · เอกสาร ${thisMonth.documents.toLocaleString("th-TH")}`}
              />
            </div>

            <ExpenseChart monthly={monthly} yearly={yearly} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {worstOverall !== "green" && urgentItem && (
              <div
                className={cn(
                  "flex flex-col gap-3 rounded-card p-5",
                  worstOverall === "red" ? "bg-flag-overdue text-surface" : "bg-flag-due-soon text-ink",
                )}
              >
                <p className="font-mono text-xs tracking-[0.12em] uppercase opacity-90">ต้องทำก่อน</p>
                <h2 className="text-2xl leading-tight font-extrabold">
                  {urgentItem.title}
                  {urgentItem.vehicleName ? ` · ${urgentItem.vehicleName}` : ""}
                </h2>
                <p className="text-sm opacity-95">
                  {urgentItem.dueMileage != null &&
                    `ครบกำหนด ${urgentItem.dueMileage.toLocaleString("th-TH")} กม.`}
                  {urgentItem.dueMileage != null && urgentItem.dueDate ? " / " : ""}
                  {urgentItem.dueDate &&
                    new Date(urgentItem.dueDate).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                </p>
                <Link
                  href={urgentItem.href}
                  className={cn(
                    "flex items-center justify-center rounded-list p-3.5 text-sm font-extrabold",
                    worstOverall === "red" ? "bg-surface text-ink" : "bg-ink text-surface",
                  )}
                >
                  บันทึกว่าทำแล้ว
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-3.5 rounded-card bg-surface-card p-5">
              <h2 className="text-lg font-extrabold text-ink">รถของฉัน</h2>
              {vehicles.map((vehicle) => {
                const status = getVehicleOverallStatus(vehicle.id, vehicle.current_mileage, logs, documents);
                return (
                  <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`} className="flex items-center gap-3.5">
                    <PlaceholderImage
                      src={vehicle.image_url}
                      alt={vehicle.name}
                      className="size-14 shrink-0 rounded-list"
                      sizes="56px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-extrabold text-ink">{vehicle.name}</p>
                      <p className="truncate text-[13px] text-ink-muted">
                        {vehicle.brand} {vehicle.model} · {vehicle.current_mileage.toLocaleString("th-TH")} กม.
                      </p>
                    </div>
                    {status && <StatusBadge status={status} className="shrink-0" />}
                  </Link>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-card bg-surface-card p-5">
              <h2 className="text-lg font-extrabold text-ink">กิจกรรมล่าสุด</h2>
              {recentActivity.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-muted">ยังไม่มีประวัติการซ่อมบำรุง</p>
              ) : (
                <div className="flex flex-col">
                  {recentActivity.map((log, index) => {
                    const Icon = getMaintenanceIcon(log.maintenance_types?.icon ?? null);
                    const isLast = index === recentActivity.length - 1;
                    return (
                      <Link
                        key={log.id}
                        href={`/vehicles/${log.vehicle_id}`}
                        className="flex gap-3"
                      >
                        <div className="flex w-3 shrink-0 flex-col items-center">
                          <span
                            className={cn(
                              "mt-1 size-2.75 shrink-0 rounded-full",
                              index === 0 ? "bg-cta" : "bg-line-dash",
                            )}
                          />
                          {!isLast && <span className="w-0.5 flex-1 bg-line" />}
                        </div>
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pb-4">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-[15px] font-extrabold text-ink">
                              <Icon className="size-3.5 shrink-0 text-ink-muted" />
                              {log.maintenance_types?.name ?? "ไม่ระบุประเภท"}
                              {" · "}
                              {vehicleNameById.get(log.vehicle_id) ?? "รถ"}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-ink-muted">
                              {new Date(log.service_date).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                              {" · "}
                              {log.mileage_at_service.toLocaleString("th-TH")} กม.
                              {log.cost !== null && (
                                <>
                                  {" · "}
                                  <span className="font-sans">฿ </span>
                                  {log.cost.toLocaleString("th-TH")}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
