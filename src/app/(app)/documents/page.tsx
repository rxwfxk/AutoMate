"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2, Plus } from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api-client";
import { getDateFlagStatus, type FlagStatus } from "@/lib/flag-status";
import { DOCUMENT_TYPE_ICON, DOCUMENT_TYPE_LABEL } from "@/lib/document-types";
import { PageHeader } from "@/components/redesign/page-header";
import { Chip } from "@/components/redesign/chip";
import { StatusDot } from "@/components/redesign/status";
import { DataRow, DataCell } from "@/components/redesign/data-row";
import type { Document } from "@/types/database.types";

type DocumentWithVehicle = Document & { vehicles: { id: string; name: string } | null };

const DUE_TEXT_COLOR: Record<FlagStatus, string> = {
  red: "text-flag-overdue",
  yellow: "text-flag-due-soon",
  green: "text-ink-3",
};

const ICON_BG: Record<FlagStatus, string> = {
  red: "bg-flag-overdue-soft text-flag-overdue-soft-foreground",
  yellow: "bg-flag-due-soon-soft text-flag-due-soon-soft-foreground",
  green: "bg-flag-ok-soft text-flag-ok-soft-foreground",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

/** Whole days until `dateStr`, counted from local midnight like getDateFlagStatus does,
 * so the number can't disagree with the flag colour beside it. */
function daysUntil(dateStr: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(`${dateStr}T00:00:00`).getTime() - start.getTime()) / 86_400_000);
}

/** The one place that words a due date: overdue never shows a negative day count. */
function formatDueLabel(status: FlagStatus, dateStr: string) {
  return status === "red" ? "เลยกำหนดแล้ว" : `อีก ${daysUntil(dateStr)} วัน`;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentWithVehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<string | "all">("all");

  useEffect(() => {
    document.title = "เอกสาร | Vehicle Maintenance Log";
  }, []);

  useEffect(() => {
    apiFetch<DocumentWithVehicle[]>("/api/documents").then((result) => {
      if (result.error) setError(result.error);
      else setDocuments(result.data ?? []);
    });
  }, []);

  const withStatus = useMemo(
    () => (documents ?? []).map((doc) => ({ doc, status: getDateFlagStatus(doc.expiry_date) })),
    [documents],
  );

  const vehicles = useMemo(() => {
    const map = new Map<string, string>();
    for (const { doc } of withStatus) {
      if (doc.vehicles) map.set(doc.vehicles.id, doc.vehicles.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [withStatus]);

  const attentionItems = withStatus.filter((d) => d.status !== "green").sort((a, b) => a.doc.expiry_date.localeCompare(b.doc.expiry_date));
  const nearest = attentionItems[0];

  const visible = withStatus
    .filter((d) => vehicleFilter === "all" || d.doc.vehicle_id === vehicleFilter)
    .sort((a, b) => a.doc.expiry_date.localeCompare(b.doc.expiry_date));

  const totalCostThisYear = (documents ?? [])
    // issue_date is optional — fall back to created_at like aggregateMonthlyExpenses does,
    // so a same-year document without an issue date isn't silently left out of the total.
    .filter((d) => (d.issue_date || d.created_at).slice(0, 4) === String(new Date().getFullYear()))
    .reduce((sum, d) => sum + (d.cost ?? 0), 0);

  return (
    <div className="flex w-full flex-1 flex-col bg-base p-5 lg:p-8">
      {/* Mobile/tablet layout — README Screen 4a. */}
      <div className="flex flex-col gap-3.5 lg:hidden">
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
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink-muted">
                {documents ? `${documents.length} ฉบับ` : ""}
                {attentionItems.length > 0 ? ` · ใกล้หมดอายุ ${attentionItems.length}` : ""}
              </p>
              <h1 className="truncate text-lg font-extrabold text-ink">เอกสาร</h1>
            </div>
          </div>
          <Link
            href="/vehicles"
            aria-label="เพิ่มเอกสาร"
            className="flex size-10.5 shrink-0 items-center justify-center rounded-icon bg-cta text-surface"
          >
            <Plus className="size-5" />
          </Link>
        </div>

        {error && <p className="text-sm font-bold text-flag-overdue">{error}</p>}

        {documents === null && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        )}

        {nearest && (
          <Link
            href={`/vehicles/${nearest.doc.vehicle_id}/documents/${nearest.doc.id}/edit`}
            className="flex gap-3.5 rounded-list bg-flag-due-soon-soft p-4"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-icon bg-flag-due-soon text-ink">
              <FileText className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] leading-tight font-extrabold text-ink">
                {DOCUMENT_TYPE_LABEL[nearest.doc.document_type]} · {nearest.doc.vehicles?.name ?? "รถ"}{" "}
                {formatDueLabel(nearest.status, nearest.doc.expiry_date)}
              </p>
              {attentionItems.length > 1 && (
                <p className="mt-0.5 text-[13px] text-ink-3">และอีก {attentionItems.length - 1} ฉบับ</p>
              )}
            </div>
          </Link>
        )}

        {vehicles.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            <Chip selected={vehicleFilter === "all"} onClick={() => setVehicleFilter("all")}>
              ทั้งหมด
            </Chip>
            {vehicles.map((v) => (
              <Chip key={v.id} selected={vehicleFilter === v.id} onClick={() => setVehicleFilter(v.id)}>
                {v.name}
              </Chip>
            ))}
          </div>
        )}

        {documents && documents.length > 0 ? (
          <div className="flex flex-col gap-2.25">
            {visible.map(({ doc, status }) => {
              const Icon = DOCUMENT_TYPE_ICON[doc.document_type];
              return (
                <Link
                  key={doc.id}
                  href={`/vehicles/${doc.vehicle_id}/documents/${doc.id}/edit`}
                  className={cn(
                    "flex gap-3 rounded-list border border-line bg-surface-card p-3.5",
                    status === "yellow" && "border-[1.5px] border-flag-due-soon bg-flag-due-soon-soft",
                    status === "red" && "border-[1.5px] border-flag-overdue bg-flag-overdue-soft",
                  )}
                >
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-icon", ICON_BG[status])}>
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-extrabold text-ink">
                      {DOCUMENT_TYPE_LABEL[doc.document_type]}
                    </p>
                    <p className="truncate text-xs text-ink-3">
                      {doc.vehicles?.name ?? "รถ"}
                      {doc.policy_number ? ` · ${doc.policy_number}` : ""}
                    </p>
                    <p className={cn("truncate font-mono text-xs", DUE_TEXT_COLOR[status])}>
                      {formatDate(doc.expiry_date)}
                      {status !== "green" && ` · ${formatDueLabel(status, doc.expiry_date)}`}
                    </p>
                  </div>
                  {doc.cost !== null ? (
                    <p className="shrink-0 font-mono text-[13px] whitespace-nowrap text-ink-3">
                      <span className="font-sans">฿ </span>
                      {doc.cost.toLocaleString("th-TH")}
                    </p>
                  ) : !doc.file_url ? (
                    <span className="shrink-0 text-xs font-extrabold whitespace-nowrap text-cta">แนบไฟล์</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ) : documents && documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-list border border-dashed border-line-dash py-16 text-center">
            <FileText className="size-10 text-ink-faint" />
            <p className="text-ink-muted">ยังไม่มีเอกสาร</p>
          </div>
        ) : null}
      </div>

      {/* Desktop layout — README Screen 3d (Turn 4: driving-license bar removed, total row added). */}
      <div className="hidden w-full flex-col gap-5 lg:flex">
        <PageHeader
          eyebrow={
            <p className="text-sm font-bold text-ink-muted">
              {documents ? `${documents.length} ฉบับ` : ""}
              {attentionItems.length > 0 ? ` · ใกล้หมดอายุ ${attentionItems.length} ฉบับ` : ""}
              {" · ใบขับขี่อยู่ที่หน้าโปรไฟล์"}
            </p>
          }
          title="เอกสาร"
          actions={
            <>
              <Link
                href="/profile"
                className="flex items-center rounded-[16px] border-[1.5px] border-line-strong px-4.5 py-3.25 text-[15px] font-extrabold text-ink"
              >
                ตั้งค่าการแจ้งเตือน
              </Link>
              <Link
                href="/vehicles"
                className="flex items-center rounded-[16px] bg-cta px-5 py-3.25 text-[15px] font-extrabold text-surface"
              >
                + เพิ่มเอกสาร
              </Link>
            </>
          }
        />

        {error && <p className="text-sm font-bold text-flag-overdue">{error}</p>}

        {documents === null && !error ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <>
            {nearest && (
              <Link
                href={`/vehicles/${nearest.doc.vehicle_id}/documents/${nearest.doc.id}/edit`}
                className="flex items-center gap-4.5 rounded-card bg-flag-due-soon-soft p-4.5"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-list bg-flag-due-soon text-ink">
                  <FileText className="size-5.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[19px] leading-tight font-extrabold text-ink">
                    {DOCUMENT_TYPE_LABEL[nearest.doc.document_type]} · {nearest.doc.vehicles?.name ?? "รถ"} ·{" "}
                    {formatDueLabel(nearest.status, nearest.doc.expiry_date)}
                  </p>
                  <p className="text-sm text-ink-2">
                    หมดอายุ {formatDate(nearest.doc.expiry_date)} — อาจกระทบการต่อภาษี/เคลม
                    {attentionItems.length > 1 ? ` · และอีก ${attentionItems.length - 1} ฉบับ` : ""}
                  </p>
                </div>
              </Link>
            )}

            <div className="flex flex-col gap-4 rounded-card bg-surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Chip selected={vehicleFilter === "all"} onClick={() => setVehicleFilter("all")}>
                    ทั้งหมด
                  </Chip>
                  {vehicles.map((v) => (
                    <Chip key={v.id} selected={vehicleFilter === v.id} onClick={() => setVehicleFilter(v.id)}>
                      {v.name}
                    </Chip>
                  ))}
                </div>
                <span className="shrink-0 text-[13px] font-bold text-ink-3">เรียงตาม: วันหมดอายุ</span>
              </div>

              {visible.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {visible.map(({ doc, status }) => {
                    const Icon = DOCUMENT_TYPE_ICON[doc.document_type];
                    return (
                      <Link key={doc.id} href={`/vehicles/${doc.vehicle_id}/documents/${doc.id}/edit`}>
                        <DataRow
                          className={
                            status === "yellow"
                              ? "border-[1.5px] border-flag-due-soon bg-flag-due-soon-soft"
                              : status === "red"
                                ? "border-[1.5px] border-flag-overdue bg-flag-overdue-soft"
                                : undefined
                          }
                        >
                          <DataCell width={34}>
                            <div className={cn("flex size-8.5 items-center justify-center rounded-icon", ICON_BG[status])}>
                              <Icon className="size-4" />
                            </div>
                          </DataCell>
                          <DataCell flex>
                            <p className="truncate text-base font-extrabold text-ink">
                              {DOCUMENT_TYPE_LABEL[doc.document_type]}
                            </p>
                            {doc.policy_number && (
                              <p className="truncate font-mono text-xs text-ink-3">{doc.policy_number}</p>
                            )}
                          </DataCell>
                          <DataCell width={150}>
                            <p className="truncate text-sm font-bold text-ink-3">{doc.vehicles?.name ?? "รถ"}</p>
                          </DataCell>
                          <DataCell width={170}>
                            <p className={cn("truncate font-mono text-sm", DUE_TEXT_COLOR[status])}>
                              {formatDate(doc.expiry_date)}
                            </p>
                            {status !== "green" && (
                              <p className={cn("text-xs font-bold", DUE_TEXT_COLOR[status])}>
                                {formatDueLabel(status, doc.expiry_date)}
                              </p>
                            )}
                          </DataCell>
                          <DataCell width={96} className="text-right">
                            {doc.cost !== null && (
                              <p className="font-mono text-sm whitespace-nowrap text-ink-3">
                                <span className="font-sans">฿ </span>
                                {doc.cost.toLocaleString("th-TH")}
                              </p>
                            )}
                          </DataCell>
                          <DataCell width={84} className="text-right">
                            {doc.file_url ? (
                              <span className="text-xs font-extrabold whitespace-nowrap text-cta">ดูไฟล์</span>
                            ) : (
                              <span className="text-xs font-bold whitespace-nowrap text-ink-faint">แนบไฟล์</span>
                            )}
                          </DataCell>
                        </DataRow>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-ink-muted">ยังไม่มีเอกสาร</p>
              )}

              {(documents?.length ?? 0) > 0 && (
                <div className="flex items-center justify-between border-t border-line pt-3.5">
                  <p className="text-sm font-bold text-ink-3">ค่าเอกสารรวมทั้งปี ({new Date().getFullYear()})</p>
                  <p className="font-mono text-[15px] font-bold text-ink">
                    <span className="font-sans">฿ </span>
                    {totalCostThisYear.toLocaleString("th-TH")}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
