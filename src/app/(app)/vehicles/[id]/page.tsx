"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, FileText, Loader2, Paperclip, Pencil, Plus, Wrench } from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api-client";
import {
  getDateFlagStatus,
  getMaintenanceFlagStatus,
  worseFlag,
  type FlagStatus,
} from "@/lib/flag-status";
import { getMostUrgentItem } from "@/lib/dashboard-data";
import { getCurrentDocumentIds, getCurrentLogIds } from "@/lib/current-items";
import { DOCUMENT_TYPE_LABEL } from "@/lib/document-types";
import { Card } from "@/components/redesign/card";
import { Button, buttonVariants } from "@/components/redesign/button";
import { StatusDot, StatusBadge, HistoryTag } from "@/components/redesign/status";
import { PlaceholderImage } from "@/components/redesign/placeholder-image";
import { PageHeader, Breadcrumb } from "@/components/redesign/page-header";
import { Chip } from "@/components/redesign/chip";
import { DataRow, DataCell } from "@/components/redesign/data-row";
import { DeleteVehicleDialog } from "@/components/vehicles/delete-vehicle-dialog";
import {
  MaintenanceLogItem,
  type MaintenanceLogWithType,
} from "@/components/maintenance/maintenance-log-item";
import { DocumentItem } from "@/components/documents/document-item";
import { DeleteMaintenanceLogDialog } from "@/components/maintenance/delete-maintenance-log-dialog";
import { DeleteDocumentDialog } from "@/components/documents/delete-document-dialog";
import type { Document, Vehicle } from "@/types/database.types";

type VehicleDetailResponse = {
  vehicle: Vehicle;
  logs: MaintenanceLogWithType[];
  documents: Document[];
};

type Tab = "maintenance" | "documents";

const DUE_TEXT_COLOR: Record<FlagStatus, string> = {
  red: "text-flag-overdue",
  yellow: "text-flag-due-soon",
  green: "text-ink-3",
};

const STATUS_RANK: Record<FlagStatus, number> = { red: 0, yellow: 1, green: 2 };

// The nested maintenance_types join on this endpoint only selects
// default_interval_km (see /api/vehicles/[id]), not _months — so the
// standard-interval hint here can only ever show the km side.
function formatStandardInterval(type: { default_interval_km: number | null } | null | undefined) {
  if (!type?.default_interval_km) return null;
  return `ทุก ${type.default_interval_km.toLocaleString("th-TH")} กม.`;
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<VehicleDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("maintenance");
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [mileageInput, setMileageInput] = useState("");
  const [mileageSaving, setMileageSaving] = useState(false);
  const [mileageError, setMileageError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<VehicleDetailResponse>(`/api/vehicles/${id}`).then((res) => {
      if (res.error) setError(res.error);
      else setResult(res.data!);
    });
  }, [id]);

  useEffect(() => {
    if (result) setMileageInput(String(result.vehicle.current_mileage));
  }, [result?.vehicle.current_mileage]);

  if (error) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3 bg-base p-4 text-center sm:p-6">
        <p className="text-ink-muted">{error}</p>
        <Link href="/vehicles" className={buttonVariants({ variant: "dark" })}>
          กลับไปหน้ารถของฉัน
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center bg-base py-16">
        <Loader2 className="size-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  const { vehicle, logs, documents } = result;

  function handleLogDeleted(logId: string) {
    setResult((prev) => (prev ? { ...prev, logs: prev.logs.filter((l) => l.id !== logId) } : prev));
  }

  function handleDocumentDeleted(docId: string) {
    setResult((prev) =>
      prev ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) } : prev,
    );
  }

  async function handleMileageSave() {
    const value = Number(mileageInput);
    // Number("") is 0, which would pass the checks below and silently zero the odometer.
    if (mileageInput.trim() === "" || !Number.isFinite(value) || value < 0) {
      setMileageError("เลขไมล์ไม่ถูกต้อง");
      return;
    }
    setMileageSaving(true);
    setMileageError(null);
    const res = await apiFetch(`/api/vehicles/${vehicle.id}`, {
      method: "PUT",
      body: JSON.stringify({
        image_url: vehicle.image_url,
        name: vehicle.name,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        license_plate: vehicle.license_plate,
        current_mileage: value,
      }),
    });
    setMileageSaving(false);
    if (res.error) {
      setMileageError(res.error);
      return;
    }
    setResult((prev) => (prev ? { ...prev, vehicle: { ...prev.vehicle, current_mileage: value } } : prev));
  }

  // Only the newest record per type raises a flag; older ones are history.
  const currentLogIds = getCurrentLogIds(logs);
  const currentDocIds = getCurrentDocumentIds(documents);
  const logStatuses = logs.map((log) =>
    !currentLogIds.has(log.id)
      ? ("green" as FlagStatus)
      : getMaintenanceFlagStatus({
      nextDueDate: log.next_due_date,
      nextDueMileage: log.next_due_mileage,
      currentMileage: vehicle.current_mileage,
      intervalKm: log.maintenance_types?.default_interval_km,
    }),
  );
  const documentStatusOf = (document: Document): FlagStatus =>
    currentDocIds.has(document.id) ? getDateFlagStatus(document.expiry_date) : "green";
  const documentStatuses = documents.map(documentStatusOf);
  // Newest record first (by when it was saved), so a renewal sits above the one it replaced.
  const sortedDocuments = [...documents].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const allStatuses = [...logStatuses, ...documentStatuses];
  const worst = allStatuses.reduce<FlagStatus>((acc, status) => worseFlag(acc, status), "green");
  const attentionCount = allStatuses.filter((status) => status !== "green").length;

  // Desktop table sorts by urgency (worst first) — mobile keeps the API's
  // own service_date-desc order untouched.
  const sortedLogs = logs
    .map((log, i) => ({ log, status: logStatuses[i] }))
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
  const totalCost =
    logs.reduce((sum, l) => sum + (l.cost ?? 0), 0) + documents.reduce((sum, d) => sum + (d.cost ?? 0), 0);
  const urgentItem = getMostUrgentItem(
    logs,
    documents,
    new Map([[vehicle.id, vehicle.current_mileage]]),
    new Map([[vehicle.id, vehicle.name]]),
  );

  return (
    <div className="flex w-full flex-1 flex-col items-center bg-base p-5 lg:p-8">
      {/* Mobile/tablet layout — README Screen 2. Untouched below this line
          except the lg:hidden that hands off to the desktop block (3b). */}
      <div className="flex w-full max-w-3xl flex-col gap-4 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="ย้อนกลับ"
              className="flex size-9.5 shrink-0 items-center justify-center rounded-icon border-[1.5px] border-line-strong text-ink"
            >
              <ArrowLeft className="size-4.5" />
            </button>
            <h1 className="truncate text-lg font-extrabold text-ink">{vehicle.name}</h1>
          </div>
          <DeleteVehicleDialog
            vehicleId={vehicle.id}
            vehicleName={vehicle.name}
            detail={result}
            onDeleted={() => router.push("/vehicles")}
          />
        </div>

        <Card tone="dark" className="flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-ink-faint">
              {vehicle.brand} {vehicle.model}
              {vehicle.year ? ` · ${vehicle.year}` : ""}
              {vehicle.license_plate ? (
                <span className="ml-2 font-mono text-[15px] text-surface">{vehicle.license_plate}</span>
              ) : null}
            </p>
            <StatusBadge status={worst} tone="solid" className="shrink-0">
              {worst === "green" ? "ปกติ" : `ต้องทำ ${attentionCount}`}
            </StatusBadge>
          </div>

          <PlaceholderImage
            src={vehicle.image_url}
            alt={vehicle.name}
            tone="dark"
            className="h-19 w-full rounded-list"
            sizes="(min-width: 640px) 512px, 100vw"
          />

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-ink-faint">เลขไมล์ปัจจุบัน</p>
              <p className="font-mono text-[26px] leading-none text-surface">
                {vehicle.current_mileage.toLocaleString("th-TH")}{" "}
                <span className="text-sm font-normal text-ink-faint">กม.</span>
              </p>
            </div>
            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              className="flex shrink-0 items-center gap-1 rounded-icon border-[1.5px] border-ink-line px-3.5 py-2.5 text-sm font-bold text-surface"
            >
              <Pencil className="size-3.5" />
              แก้ไขรถ
            </Link>
          </div>
        </Card>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("maintenance")}
            className={cn(
              "rounded-full px-4 py-2.25 text-sm font-bold",
              tab === "maintenance" ? "bg-ink font-extrabold text-surface" : "border border-line-strong text-ink-3",
            )}
          >
            ซ่อมบำรุง
          </button>
          <button
            type="button"
            onClick={() => setTab("documents")}
            className={cn(
              "rounded-full px-4 py-2.25 text-sm font-bold",
              tab === "documents" ? "bg-ink font-extrabold text-surface" : "border border-line-strong text-ink-3",
            )}
          >
            เอกสาร {documents.length}
          </button>
        </div>

        {tab === "maintenance" ? (
          logs.length > 0 ? (
            <div className="flex flex-col gap-2.25">
              {logs.map((log) => (
                <MaintenanceLogItem
                  key={log.id}
                  log={log}
                  vehicleId={vehicle.id}
                  currentMileage={vehicle.current_mileage}
                  vehicleDetail={result}
                  superseded={!currentLogIds.has(log.id)}
                  onDeleted={handleLogDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-list border border-dashed border-line-dash py-16 text-center">
              <Wrench className="size-10 text-ink-faint" />
              <p className="text-ink-muted">ยังไม่มีประวัติการซ่อมบำรุง</p>
            </div>
          )
        ) : documents.length > 0 ? (
          <div className="flex flex-col gap-2.25">
            {sortedDocuments.map((document) => (
              <DocumentItem
                key={document.id}
                superseded={!currentDocIds.has(document.id)}
                document={document}
                editHref={`/vehicles/${vehicle.id}/documents/${document.id}/edit`}
                deleteUrl={`/api/vehicles/${vehicle.id}/documents/${document.id}`}
                onDeleted={handleDocumentDeleted}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-list border border-dashed border-line-dash py-16 text-center">
            <FileText className="size-10 text-ink-faint" />
            <p className="text-ink-muted">ยังไม่มีเอกสาร (พ.ร.บ., ประกัน, ภาษี)</p>
          </div>
        )}

        {tab === "maintenance" ? (
          <Button
            type="button"
            className="w-full"
            onClick={() => router.push(`/vehicles/${vehicle.id}/maintenance/new`)}
          >
            <Plus className="size-5" />
            เพิ่มบันทึกซ่อมบำรุง
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => router.push(`/vehicles/${vehicle.id}/documents/new`)}
            className="flex w-full items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed border-line-dash p-4 text-[15px] font-extrabold text-ink-3"
          >
            <Plus className="size-4" />
            เพิ่มเอกสารของรถคันนี้
          </button>
        )}
      </div>

      {/* Desktop layout — README Screen 3b. */}
      <div className="hidden w-full flex-col gap-5 lg:flex">
        <PageHeader
          eyebrow={<Breadcrumb items={["รถของฉัน", vehicle.name]} />}
          title={vehicle.name}
          actions={
            <>
              <DeleteVehicleDialog
                vehicleId={vehicle.id}
                vehicleName={vehicle.name}
                detail={result}
                triggerClassName="flex size-12.5 items-center justify-center rounded-[16px] border-[1.5px] border-line-strong text-ink"
                onDeleted={() => router.push("/vehicles")}
              />
              <Link
                href={`/vehicles/${vehicle.id}/edit`}
                className="flex items-center rounded-[16px] border-[1.5px] border-line-strong px-4.5 py-3.25 text-[15px] font-extrabold text-ink"
              >
                แก้ไขข้อมูลรถ
              </Link>
              <Link
                href={`/vehicles/${vehicle.id}/documents/new`}
                className="flex items-center rounded-[16px] border-[1.5px] border-line-strong px-4.5 py-3.25 text-[15px] font-extrabold text-ink"
              >
                + เพิ่มเอกสาร
              </Link>
              <Link
                href={`/vehicles/${vehicle.id}/maintenance/new`}
                className="flex items-center rounded-[16px] bg-cta px-5 py-3.25 text-[15px] font-extrabold text-surface"
              >
                + เพิ่มบันทึก
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-5 min-[1440px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Left column */}
          <div className="flex min-w-0 flex-col gap-5">
            <Card tone="dark" className="flex flex-row gap-5.5">
              <PlaceholderImage
                src={vehicle.image_url}
                alt={vehicle.name}
                tone="dark"
                className="h-33 w-57.5 shrink-0 rounded-list"
                sizes="230px"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-[15px] font-semibold text-ink-faint">
                    {vehicle.brand} {vehicle.model}
                    {vehicle.year ? ` · ${vehicle.year}` : ""}
                    {vehicle.license_plate ? (
                      <span className="ml-2 font-mono text-base text-surface">{vehicle.license_plate}</span>
                    ) : null}
                  </p>
                  <StatusBadge status={worst} tone="solid" className="shrink-0">
                    {worst === "green" ? "ปกติ" : `ต้องทำ ${attentionCount} รายการ`}
                  </StatusBadge>
                </div>
                <div className="mt-auto flex gap-6.5">
                  <div>
                    <p className="text-xs font-bold text-ink-faint">เลขไมล์</p>
                    <p className="font-mono text-[28px] leading-none whitespace-nowrap text-surface">
                      {vehicle.current_mileage.toLocaleString("th-TH")}{" "}
                      <span className="text-sm text-ink-faint">กม.</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-faint">ค่าใช้จ่ายรวม</p>
                    <p className="font-mono text-[28px] leading-none whitespace-nowrap text-surface">
                      <span className="font-sans text-sm">฿ </span>
                      {totalCost.toLocaleString("th-TH")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-faint">ประวัติทั้งหมด</p>
                    <p className="font-mono text-[28px] leading-none whitespace-nowrap text-surface">
                      {logs.length} <span className="text-sm text-ink-faint">ครั้ง</span>
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-4 rounded-card bg-surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Chip selected={tab === "maintenance"} onClick={() => setTab("maintenance")}>
                    ซ่อมบำรุง {logs.length}
                  </Chip>
                  <Chip selected={tab === "documents"} onClick={() => setTab("documents")}>
                    เอกสาร {documents.length}
                  </Chip>
                </div>
                <span className="flex items-center gap-1 rounded-xl border border-line px-3.25 py-2 text-[13px] font-bold text-ink-3">
                  เรียงตาม: ความเร่งด่วน
                  <ChevronDown className="size-3.5" />
                </span>
              </div>

              {tab === "maintenance" ? (
                sortedLogs.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-2">
                      {(showAllLogs ? sortedLogs : sortedLogs.slice(0, 3)).map(({ log, status }) => {
                        const interval = formatStandardInterval(log.maintenance_types);
                        const history = !currentLogIds.has(log.id);
                        return (
                          // Delete trigger sits beside the Link (not inside it) so it can't navigate.
                          <div key={log.id} className="relative">
                          <div>
                            <DataRow
                              className={
                                status === "red" ? "border-[1.5px] border-flag-overdue bg-flag-overdue-soft" : undefined
                              }
                            >
                              <DataCell width={14}>
                                <StatusDot status={history ? "history" : status} />
                              </DataCell>
                              <DataCell flex>
                                <div className="flex items-center gap-2">
                                  <p className={cn("truncate text-base font-extrabold", history ? "text-ink-3" : "text-ink")}>
                                    {log.maintenance_types?.name ?? "ไม่ระบุประเภท"}
                                  </p>
                                </div>
                                {interval && (
                                  <p className="truncate text-xs font-semibold text-ink-muted">{interval}</p>
                                )}
                              </DataCell>
                              <DataCell width={140}>
                                <p className="truncate font-mono text-sm text-ink">
                                  {new Date(log.service_date).toLocaleDateString("th-TH", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  · {log.mileage_at_service.toLocaleString("th-TH")} กม.
                                </p>
                                {log.shop_name && (
                                  <p className="truncate text-xs text-ink-3">{log.shop_name}</p>
                                )}
                              </DataCell>
                              <DataCell width={130}>
                                {(log.next_due_date || log.next_due_mileage) && (
                                  <>
                                    <p className={cn("truncate font-mono text-sm", history ? "text-ink-muted" : DUE_TEXT_COLOR[status])}>
                                      {log.next_due_mileage
                                        ? `${log.next_due_mileage.toLocaleString("th-TH")} กม.`
                                        : ""}
                                      {log.next_due_mileage && log.next_due_date ? " / " : ""}
                                      {log.next_due_date
                                        ? new Date(log.next_due_date).toLocaleDateString("th-TH", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : ""}
                                    </p>
                                    <p className={cn("text-xs font-bold", history ? "text-ink-muted" : DUE_TEXT_COLOR[status])}>
                                      {history ? "ประวัติ" : status === "red" ? "เลยกำหนดแล้ว" : status === "yellow" ? "ใกล้ครบกำหนด" : "ยังไม่ถึงกำหนด"}
                                    </p>
                                  </>
                                )}
                              </DataCell>
                              <DataCell width={76} className="text-right">
                                {log.cost !== null && (
                                  <p className="font-mono text-sm whitespace-nowrap text-ink-3">
                                    <span className="font-sans">฿ </span>
                                    {log.cost.toLocaleString("th-TH")}
                                  </p>
                                )}
                              </DataCell>
                              <DataCell width={104} />
                            </DataRow>
                          </div>
                          <div className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-0.5">
                            {log.receipt_image_url && (
                              <a
                                href={log.receipt_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={"ดูใบเสร็จ"}
                                title={"ดูใบเสร็จ"}
                                className="flex size-8 items-center justify-center rounded-icon text-cta hover:bg-base"
                              >
                                <Paperclip className="size-4" />
                              </a>
                            )}
                            <Link
                              href={`/vehicles/${vehicle.id}/maintenance/${log.id}/edit`}
                              aria-label={`แก้ไขบันทึก ${log.maintenance_types?.name ?? ""}`}
                              className="flex size-8 items-center justify-center rounded-icon text-ink-muted hover:bg-base"
                            >
                              <Pencil className="size-4" />
                            </Link>
                            <DeleteMaintenanceLogDialog
                              logId={log.id}
                              vehicleId={vehicle.id}
                              typeName={log.maintenance_types?.name ?? "รายการนี้"}
                              detail={result}
                              onDeleted={handleLogDeleted}
                            />
                          </div>
                          </div>
                        );
                      })}
                    </div>
                    {!showAllLogs && sortedLogs.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllLogs(true)}
                        className="text-center text-sm font-extrabold text-cta"
                      >
                        ดูประวัติทั้งหมด {sortedLogs.length} รายการ
                      </button>
                    )}
                  </>
                ) : (
                  <p className="py-8 text-center text-ink-muted">ยังไม่มีประวัติการซ่อมบำรุง</p>
                )
              ) : documents.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {sortedDocuments.map((document) => {
                    const status = documentStatusOf(document);
                    const history = !currentDocIds.has(document.id);
                    return (
                      // The delete trigger sits over the row's right edge instead of inside
                      // the Link, so clicking it can't also navigate to the edit page.
                      <div key={document.id} className="relative">
                      <div>
                        <DataRow
                          className={
                            status === "yellow" ? "border-[1.5px] border-flag-due-soon bg-flag-due-soon-soft" : undefined
                          }
                        >
                          <DataCell width={14}>
                            <StatusDot status={history ? "history" : status} />
                          </DataCell>
                          <DataCell flex>
                            <div className="flex items-center gap-2">
                              <p className={cn("truncate text-base font-extrabold", history ? "text-ink-3" : "text-ink")}>
                                {DOCUMENT_TYPE_LABEL[document.document_type]}
                              </p>
                              {history && <HistoryTag />}
                            </div>
                            {document.policy_number && (
                              <p className="truncate text-xs text-ink-3">{document.policy_number}</p>
                            )}
                          </DataCell>
                          <DataCell width={155}>
                            <p className={cn("truncate font-mono text-sm", history ? "text-ink-muted" : DUE_TEXT_COLOR[status])}>
                              หมดอายุ{" "}
                              {new Date(document.expiry_date).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </DataCell>
                          <DataCell width={88} className="text-right">
                            {document.cost !== null && (
                              <p className="font-mono text-sm whitespace-nowrap text-ink-3">
                                <span className="font-sans">฿ </span>
                                {document.cost.toLocaleString("th-TH")}
                              </p>
                            )}
                          </DataCell>
                          <DataCell width={104} />
                        </DataRow>
                      </div>
                      <div className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-0.5">
                        {document.file_url && (
                              <a
                                href={document.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={"ดูไฟล์เอกสาร"}
                                title={"ดูไฟล์เอกสาร"}
                                className="flex size-8 items-center justify-center rounded-icon text-cta hover:bg-base"
                              >
                                <Paperclip className="size-4" />
                              </a>
                            )}
                            <Link
                          href={`/vehicles/${vehicle.id}/documents/${document.id}/edit`}
                          aria-label={`แก้ไข ${DOCUMENT_TYPE_LABEL[document.document_type]}`}
                          className="flex size-8 items-center justify-center rounded-icon text-ink-muted hover:bg-base"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <DeleteDocumentDialog
                          docId={document.id}
                          label={DOCUMENT_TYPE_LABEL[document.document_type]}
                          deleteUrl={`/api/vehicles/${vehicle.id}/documents/${document.id}`}
                          cost={document.cost}
                          hasFile={!!document.file_url}
                          onDeleted={handleDocumentDeleted}
                        />
                      </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-ink-muted">ยังไม่มีเอกสาร</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex min-w-0 flex-col gap-5">
            {worst !== "green" && urgentItem && (
              <div
                className={cn(
                  "flex flex-col gap-3 rounded-card p-5",
                  worst === "red" ? "bg-flag-overdue text-surface" : "bg-flag-due-soon text-ink",
                )}
              >
                <p className="font-mono text-xs tracking-[0.12em] uppercase opacity-90">ต้องทำก่อน</p>
                <h2 className="text-[23px] leading-tight font-extrabold">{urgentItem.title}</h2>
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
                    worst === "red" ? "bg-surface text-ink" : "bg-ink text-surface",
                  )}
                >
                  บันทึกว่าทำแล้ว
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-3.5 rounded-card bg-surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-ink">เอกสารของรถคันนี้</h2>
                <button
                  type="button"
                  onClick={() => setTab("documents")}
                  className="text-sm font-bold text-cta"
                >
                  จัดการ
                </button>
              </div>
              {documents.length > 0 ? (
                sortedDocuments.map((document) => {
                  const status = documentStatusOf(document);
                  const history = !currentDocIds.has(document.id);
                  return (
                    <div key={document.id} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8.5 shrink-0 items-center justify-center rounded-icon",
                          history
                            ? "bg-line text-ink-muted"
                            : status === "red"
                            ? "bg-flag-overdue-soft text-flag-overdue-soft-foreground"
                            : status === "yellow"
                              ? "bg-flag-due-soon-soft text-flag-due-soon-soft-foreground"
                              : "bg-flag-ok-soft text-flag-ok-soft-foreground",
                        )}
                      >
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={cn("truncate text-[15px] font-extrabold", history ? "text-ink-3" : "text-ink")}>
                            {DOCUMENT_TYPE_LABEL[document.document_type]}
                          </p>
                          {history && <HistoryTag />}
                        </div>
                        <p className={cn("font-mono text-xs whitespace-nowrap", history ? "text-ink-muted" : DUE_TEXT_COLOR[status])}>
                          {new Date(document.expiry_date).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-ink-muted">ยังไม่มีเอกสาร</p>
              )}
            </div>

            <div className="flex flex-col gap-2.5 rounded-card bg-surface-card p-5">
              <h2 className="text-lg font-extrabold text-ink">อัปเดตเลขไมล์</h2>
              <p className="text-sm text-ink-3">ให้ธงเตือนแม่นขึ้น</p>
              <div className="flex gap-2.5">
                <input
                  type="number"
                  inputMode="numeric"
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  className="min-w-0 flex-1 rounded-list border-[1.5px] border-ink bg-surface-card px-4 py-3 font-mono text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={handleMileageSave}
                  disabled={mileageSaving}
                  className="flex shrink-0 items-center gap-1.5 rounded-list bg-ink px-5 py-3 text-sm font-extrabold text-surface disabled:opacity-50"
                >
                  {mileageSaving && <Loader2 className="size-4 animate-spin" />}
                  บันทึก
                </button>
              </div>
              {mileageError && <p className="text-xs font-bold text-flag-overdue">{mileageError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
