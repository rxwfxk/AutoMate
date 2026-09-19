"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Bike } from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api-client";
import { MAINTENANCE_COLOR, DOCUMENTS_COLOR } from "@/lib/chart-colors";
import { getVehicleOverallStatus, getTopUrgentItems } from "@/lib/dashboard-data";
import { buttonVariants } from "@/components/redesign/button";
import { PageHeader } from "@/components/redesign/page-header";
import { Chip } from "@/components/redesign/chip";
import { StatusBadge, StatusDot } from "@/components/redesign/status";
import { PlaceholderImage } from "@/components/redesign/placeholder-image";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { DeleteVehicleDialog } from "@/components/vehicles/delete-vehicle-dialog";
import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";
import type { Document, Vehicle } from "@/types/database.types";

type VehicleDetail = { vehicle: Vehicle; logs: MaintenanceLogWithType[]; documents: Document[] };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<VehicleDetail[] | null>(null);
  const [filter, setFilter] = useState<"all" | "urgent">("all");

  useEffect(() => {
    apiFetch<Vehicle[]>("/api/vehicles").then((result) => {
      if (result.error) setError(result.error);
      else setVehicles(result.data ?? []);
    });
  }, []);

  // Desktop-only: the mobile cards above only need the plain vehicle list,
  // but the 3a grid needs each vehicle's flag status/urgent items/cost —
  // compose it the same way the dashboard already does (per-vehicle GET).
  useEffect(() => {
    if (!vehicles) return;
    if (vehicles.length === 0) {
      setDetails([]);
      return;
    }
    Promise.all(vehicles.map((v) => apiFetch<VehicleDetail>(`/api/vehicles/${v.id}`))).then((results) => {
      const failed = results.find((r) => r.error);
      if (failed) {
        setDetailsError(failed.error!);
        return;
      }
      setDetails(results.map((r) => r.data!));
    });
  }, [vehicles]);

  function handleDeleted(id: string) {
    setVehicles((prev) => prev?.filter((v) => v.id !== id) ?? prev);
    setDetails((prev) => prev?.filter((d) => d.vehicle.id !== id) ?? prev);
  }

  const vehicleMileageById = new Map((vehicles ?? []).map((v) => [v.id, v.current_mileage]));
  const vehicleNameById = new Map((vehicles ?? []).map((v) => [v.id, v.name]));

  const attentionCount =
    details?.reduce((sum, d) => {
      const status = getVehicleOverallStatus(d.vehicle.id, d.vehicle.current_mileage, d.logs, d.documents);
      return sum + (status && status !== "green" ? 1 : 0);
    }, 0) ?? 0;

  const visibleDetails = (details ?? []).filter((d) => {
    if (filter === "all") return true;
    const status = getVehicleOverallStatus(d.vehicle.id, d.vehicle.current_mileage, d.logs, d.documents);
    return status === "red" || status === "yellow";
  });

  return (
    <div className="flex w-full flex-1 flex-col gap-5 bg-base p-5 lg:p-8">
      {/* Mobile/tablet layout — untouched below this line except lg:hidden. */}
      <div className="flex flex-col gap-5 lg:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-ink">รถของฉัน</h1>
          <Link href="/vehicles/new" className={buttonVariants({ className: "gap-1.5" })}>
            <Plus className="size-4" />
            เพิ่มรถ
          </Link>
        </div>

        {error && <p className="text-sm font-bold text-flag-overdue">{error}</p>}

        {vehicles === null && !error && (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        )}

        {vehicles && vehicles.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onDeleted={handleDeleted} />
            ))}
          </div>
        )}

        {vehicles && vehicles.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border-[1.5px] border-dashed border-line-dash py-16 text-center">
            <Bike className="size-10 text-ink-faint" />
            <p className="text-ink-muted">ยังไม่มีรถในระบบ</p>
            <Link href="/vehicles/new" className={buttonVariants({ className: "gap-1.5" })}>
              <Plus className="size-4" />
              เพิ่มรถคันแรก
            </Link>
          </div>
        )}
      </div>

      {/* Desktop layout — README Screen 3a. */}
      <div className="hidden flex-col gap-5 lg:flex">
        <PageHeader
          eyebrow={
            <p className="text-sm font-bold text-ink-muted">
              {vehicles?.length ?? 0} คัน{attentionCount > 0 ? ` · ต้องดำเนินการ ${attentionCount} รายการ` : ""}
            </p>
          }
          title="รถของฉัน"
          actions={
            <>
              <Chip selected={filter === "all"} onClick={() => setFilter("all")}>
                ทั้งหมด
              </Chip>
              <Chip selected={filter === "urgent"} onClick={() => setFilter("urgent")}>
                ต้องทำก่อน
              </Chip>
              <Link
                href="/vehicles/new"
                className="ml-1 flex items-center gap-1.5 rounded-[16px] bg-cta px-5 py-3.25 text-[15px] font-extrabold text-surface"
              >
                <Plus className="size-4" />
                เพิ่มรถ
              </Link>
            </>
          }
        />

        {(error ?? detailsError) && (
          <p className="text-sm font-bold text-flag-overdue">{error ?? detailsError}</p>
        )}

        {details === null && !error && !detailsError ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-5">
              {visibleDetails.map(({ vehicle, logs, documents }) => {
                const status = getVehicleOverallStatus(vehicle.id, vehicle.current_mileage, logs, documents);
                const urgentItems = getTopUrgentItems(logs, documents, vehicleMileageById, vehicleNameById, 2);
                return (
                  <div
                    key={vehicle.id}
                    className={cn(
                      "flex flex-col overflow-hidden rounded-card border bg-surface-card",
                      status === "red" ? "border-[1.5px] border-flag-overdue" : "border-line",
                    )}
                  >
                    <div className="relative h-38">
                      <PlaceholderImage src={vehicle.image_url} alt={vehicle.name} className="size-full" sizes="360px" />
                      {status && (
                        <StatusBadge status={status} tone="solid" className="absolute top-3.5 left-3.5" />
                      )}
                      <DeleteVehicleDialog
                        vehicleId={vehicle.id}
                        vehicleName={vehicle.name}
                        detail={{ vehicle, logs, documents }}
                        triggerClassName="absolute top-3 right-3 flex size-9 items-center justify-center rounded-icon bg-surface-card/90 shadow-card"
                        onDeleted={handleDeleted}
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-4.5">
                      <div>
                        <p className="truncate text-lg font-extrabold text-ink">{vehicle.name}</p>
                        <p className="truncate text-[13px] font-semibold text-ink-muted">
                          {vehicle.brand} {vehicle.model}
                          {vehicle.year ? ` · ${vehicle.year}` : ""}
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-ink-muted">เลขไมล์</p>
                          <p className="truncate font-mono text-[17px] text-ink">
                            {vehicle.current_mileage.toLocaleString("th-TH")} กม.
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-ink-muted">ทะเบียน</p>
                          <p className="truncate font-mono text-[17px] text-ink">
                            {vehicle.license_plate || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 border-t border-line pt-3">
                        {urgentItems.length > 0 ? (
                          urgentItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <StatusDot status={item.status} className="shrink-0" />
                              <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{item.title}</p>
                              <p
                                className={cn(
                                  "shrink-0 font-mono text-xs",
                                  item.status === "red" ? "text-flag-overdue" : "text-flag-due-soon",
                                )}
                              >
                                {item.dueDate
                                  ? new Date(item.dueDate).toLocaleDateString("th-TH", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : item.dueMileage != null
                                    ? `${item.dueMileage.toLocaleString("th-TH")} กม.`
                                    : ""}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-ink-muted">ทุกอย่างเรียบร้อย</p>
                        )}
                      </div>

                      <div className="mt-auto flex gap-2.5 pt-1">
                        <Link
                          href={`/vehicles/${vehicle.id}/maintenance/new`}
                          className="flex flex-1 items-center justify-center rounded-list bg-ink p-3 text-sm font-extrabold text-surface"
                        >
                          บันทึกงาน
                        </Link>
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="flex flex-1 items-center justify-center rounded-list border-[1.5px] border-line-strong p-3 text-sm font-extrabold text-ink"
                        >
                          ดูรถ
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Link
                href="/vehicles/new"
                className="flex flex-col items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-line-dash p-6 text-center"
              >
                <div className="flex size-13 items-center justify-center rounded-list bg-cta-soft text-cta">
                  <Plus className="size-6.5" />
                </div>
                <p className="text-[17px] font-extrabold text-ink">เพิ่มรถ</p>
                <p className="max-w-60 text-sm text-ink-3">เพิ่มมอเตอร์ไซค์อีกคันเพื่อเริ่มติดตามการดูแลรักษา</p>
              </Link>
            </div>

            {(details?.length ?? 0) > 0 && (
              <div className="flex flex-col gap-4 rounded-card bg-surface-card p-5">
                <h2 className="text-lg font-extrabold text-ink">เทียบค่าใช้จ่ายรายคัน</h2>
                {(details ?? []).map(({ vehicle, logs, documents }) => {
                  const maintenanceCost = logs.reduce((sum, l) => sum + (l.cost ?? 0), 0);
                  const documentsCost = documents.reduce((sum, d) => sum + (d.cost ?? 0), 0);
                  const total = maintenanceCost + documentsCost;
                  const maintenancePct = total > 0 ? (maintenanceCost / total) * 100 : 0;
                  const documentsPct = total > 0 ? (documentsCost / total) * 100 : 0;
                  return (
                    <div key={vehicle.id} className="flex items-center gap-4">
                      <p className="w-30 shrink-0 truncate text-[15px] font-extrabold text-ink">{vehicle.name}</p>
                      <div className="h-6.5 min-w-0 flex-1 overflow-hidden rounded-lg bg-[#f6ece4]">
                        {total > 0 && (
                          <div className="flex h-full w-full">
                            <div style={{ width: `${maintenancePct}%`, backgroundColor: MAINTENANCE_COLOR }} />
                            <div style={{ width: `${documentsPct}%`, backgroundColor: DOCUMENTS_COLOR }} />
                          </div>
                        )}
                      </div>
                      <p className="w-24 shrink-0 text-right font-mono text-[15px] text-ink">
                        <span className="font-sans">฿ </span>
                        {total.toLocaleString("th-TH")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
