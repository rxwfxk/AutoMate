"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, IdCard, Loader2, LogOut, Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";
import { getDateFlagStatus } from "@/lib/flag-status";
import { getUsageSummary } from "@/lib/dashboard-data";
import { buildAccountDataCsv, downloadCsv } from "@/lib/export-csv";
import { SignOutDialog } from "@/components/layout/sign-out-dialog";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeader } from "@/components/redesign/page-header";
import { StatusBadge } from "@/components/redesign/status";
import { Toggle } from "@/components/redesign/toggle";
import { Chip } from "@/components/redesign/chip";
import { DeleteDocumentDialog } from "@/components/documents/delete-document-dialog";
import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";
import type { Document, Vehicle } from "@/types/database.types";

type VehicleDetail = { vehicle: Vehicle; logs: MaintenanceLogWithType[]; documents: Document[] };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<Document | null | undefined>(undefined);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    document.title = "โปรไฟล์ | Vehicle Maintenance Log";
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
    });

    apiFetch<{ document: Document | null }>("/api/driving-license").then((result) => {
      setDrivingLicense(result.error ? null : result.data!.document);
    });
  }, [router]);

  // Desktop-only: the mobile view above never needed each vehicle's full
  // history, but the 3e "สรุปการใช้งาน" card and CSV export do — fetch it
  // separately instead of widening the effect above.
  const [details, setDetails] = useState<VehicleDetail[] | null>(null);

  useEffect(() => {
    apiFetch<Vehicle[]>("/api/vehicles").then((result) => {
      if (result.error) return;
      const vehicles = result.data!;
      if (vehicles.length === 0) {
        setDetails([]);
        return;
      }
      Promise.all(vehicles.map((v) => apiFetch<VehicleDetail>(`/api/vehicles/${v.id}`))).then((results) => {
        if (results.some((r) => r.error)) return;
        setDetails(results.map((r) => r.data!));
      });
    });
  }, []);

  const usageSummary = useMemo(() => {
    if (!details) return null;
    const logs = details.flatMap((d) => d.logs);
    const documents = details.flatMap((d) => d.documents);
    return getUsageSummary(details.length, logs, documents);
  }, [details]);

  function handleExportCsv() {
    if (!details) return;
    const logsByVehicle = new Map(details.map((d) => [d.vehicle.id, d.logs]));
    const documentsByVehicle = new Map(details.map((d) => [d.vehicle.id, d.documents]));
    const csv = buildAccountDataCsv(
      details.map((d) => d.vehicle),
      logsByVehicle,
      documentsByVehicle,
    );
    downloadCsv(`automate-export-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  async function handleResetPassword() {
    if (!user?.email) return;
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(user.email);
    setResetSent(true);
  }

  function handleLicenseDeleted() {
    setDrivingLicense(null);
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-base py-16">
        <Loader2 className="size-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col bg-base p-5 lg:p-8">
    <div className="flex w-full flex-1 flex-col gap-4 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-extrabold text-ink md:text-xl">โปรไฟล์</h1>

        {/* Desktop already has this in the sidebar — this is the only way to
            reach it on mobile now that the drawer is gone in favor of the
            bottom nav (see mobile-bottom-nav.tsx). */}
        <SignOutDialog triggerClassName="flex size-9.5 items-center justify-center rounded-icon border-[1.5px] border-line-strong text-ink md:hidden">
          <LogOut className="size-4" />
        </SignOutDialog>
      </div>

      {/* Single column on mobile; two columns on desktop so the page uses the
          available width instead of a narrow centered strip. */}
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6 xl:max-w-4xl">
        <div className="rounded-card bg-surface-card p-5 shadow-card">
          <ProfileForm user={user} />
        </div>

        {/* Driving license — design_handoff_automate_redesign/README.md Screen 4's
            "ใบขับขี่ของฉัน" card. */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold text-ink">ใบขับขี่</h2>

          {drivingLicense === undefined ? (
            <div className="flex items-center justify-center rounded-card bg-ink py-8">
              <Loader2 className="size-5 animate-spin text-ink-faint" />
            </div>
          ) : drivingLicense ? (
            <div className="flex flex-col gap-3 rounded-card bg-ink p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold text-surface">ใบขับขี่</p>
                  {drivingLicense.policy_number && (
                    <p className="font-mono text-[13px] text-ink-faint">{drivingLicense.policy_number}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={getDateFlagStatus(drivingLicense.expiry_date)} tone="solid" />
                  <DeleteDocumentDialog
                    docId={drivingLicense.id}
                    label="ใบขับขี่"
                    deleteUrl="/api/driving-license"
                    cost={drivingLicense.cost}
                    hasFile={!!drivingLicense.file_url}
                    onDeleted={handleLicenseDeleted}
                  />
                </div>
              </div>

              <div className="flex gap-5">
                <div>
                  <p className="text-xs font-bold text-ink-faint">วันออกบัตร</p>
                  <p className="font-mono text-base text-surface">
                    {drivingLicense.issue_date
                      ? new Date(drivingLicense.issue_date).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-faint">หมดอายุ</p>
                  <p className="font-mono text-base text-surface">
                    {new Date(drivingLicense.expiry_date).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <Link
                  href="/profile/driving-license"
                  className="flex flex-1 items-center justify-center rounded-icon border-[1.5px] border-ink-line p-3 text-sm font-extrabold text-surface"
                >
                  แก้ไข
                </Link>
                {drivingLicense.file_url && (
                  <a
                    href={drivingLicense.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center rounded-icon border-[1.5px] border-ink-line p-3 text-sm font-extrabold text-surface"
                  >
                    ดูไฟล์ที่แนบ
                  </a>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/profile/driving-license")}
              className="flex flex-col items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-line-dash bg-surface-card py-10 text-center"
            >
              <IdCard className="size-8 text-ink-faint" />
              <p className="text-sm text-ink-muted">ยังไม่มีข้อมูลใบขับขี่</p>
              <span className="mt-1 flex items-center gap-1 text-sm font-bold text-cta">
                <Plus className="size-4" />
                เพิ่มใบขับขี่
              </span>
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Desktop layout — README Screen 3e. */}
    <div className="hidden w-full flex-col gap-5 lg:flex">
      <PageHeader title="โปรไฟล์" />

      <div className="grid grid-cols-[1fr_400px] items-start gap-5">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-card bg-surface-card p-5.5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-ink-faint">
                สมาชิกตั้งแต่{" "}
                {user.created_at &&
                  new Date(user.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "short" })}
              </p>
              <button
                type="button"
                onClick={handleResetPassword}
                className="rounded-button border border-line-strong px-4 py-2 text-sm font-bold text-ink"
              >
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
            {resetSent && (
              <p className="mb-3 text-sm font-bold text-flag-ok">
                ส่งลิงก์เปลี่ยนรหัสผ่านไปที่อีเมลแล้ว
              </p>
            )}
            <ProfileForm user={user} />
          </div>

          <div className="flex flex-col gap-4 rounded-card bg-surface-card p-5.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-ink">การแจ้งเตือน</h2>
              <span className="rounded-full bg-line px-2.5 py-1 text-xs font-bold text-ink-3">เร็วๆ นี้</span>
            </div>
            <p className="text-sm text-ink-3">
              ตั้งค่าว่าจะให้เตือนเรื่องอะไรบ้าง และล่วงหน้ากี่วัน/กี่กิโลเมตร
            </p>

            <div className="flex flex-col gap-3.5">
              {[
                { label: "แจ้งเตือนทางอีเมล", desc: "ส่งอีเมลเมื่อมีรายการใกล้ครบกำหนด" },
                { label: "แจ้งเตือนบนเบราว์เซอร์", desc: "แจ้งเตือนแบบ push บนเบราว์เซอร์" },
                { label: "เตือนซ้ำเมื่อยังไม่ได้ทำ", desc: "ทุก 7 วัน จนกว่าจะบันทึกว่าทำแล้ว" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-extrabold text-ink">{row.label}</p>
                    <p className="text-[13px] text-ink-3">{row.desc}</p>
                  </div>
                  <Toggle checked={false} onChange={() => {}} disabled className="shrink-0" />
                </div>
              ))}
            </div>

            <div className="border-t border-line" />

            <div className="flex flex-wrap gap-5">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-ink-3">เตือนล่วงหน้า · งานซ่อมบำรุง</p>
                <div className="flex flex-wrap gap-2">
                  {["200 กม.", "500 กม.", "1,000 กม."].map((label) => (
                    <Chip key={label} disabled className="pointer-events-none opacity-55">
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-ink-3">เตือนล่วงหน้า · เอกสาร</p>
                <div className="flex flex-wrap gap-2">
                  {["7 วัน", "14 วัน", "30 วัน"].map((label) => (
                    <Chip key={label} disabled className="pointer-events-none opacity-55">
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — width:400px per spec. */}
        <div className="flex w-full min-w-0 flex-col gap-5">
          {drivingLicense === undefined ? (
            <div className="flex items-center justify-center rounded-card bg-ink py-8">
              <Loader2 className="size-5 animate-spin text-ink-faint" />
            </div>
          ) : drivingLicense ? (
            <div className="flex flex-col gap-3.5 rounded-card bg-ink p-5.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs tracking-[0.12em] text-ink-faint uppercase">ใบขับขี่ของฉัน</p>
                  <p className="text-lg font-extrabold text-surface">ใบขับขี่</p>
                  {drivingLicense.policy_number && (
                    <p className="font-mono text-[13px] text-ink-faint">{drivingLicense.policy_number}</p>
                  )}
                </div>
                <StatusBadge status={getDateFlagStatus(drivingLicense.expiry_date)} tone="solid" className="shrink-0" />
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-bold text-ink-faint">วันออกบัตร</p>
                  <p className="font-mono text-[17px] whitespace-nowrap text-surface">
                    {drivingLicense.issue_date
                      ? new Date(drivingLicense.issue_date).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-faint">หมดอายุ</p>
                  <p className="font-mono text-[17px] whitespace-nowrap text-surface">
                    {new Date(drivingLicense.expiry_date).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5">
                {drivingLicense.file_url && (
                  <a
                    href={drivingLicense.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center rounded-list border-[1.5px] border-ink-line p-3 text-sm font-extrabold text-surface"
                  >
                    ดูไฟล์ที่แนบ
                  </a>
                )}
                <Link
                  href="/profile/driving-license"
                  className="flex flex-1 items-center justify-center rounded-list border-[1.5px] border-ink-line p-3 text-sm font-extrabold text-surface"
                >
                  แก้ไข
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-card border border-flag-due-soon bg-flag-due-soon-soft p-5.5">
              <p className="text-base font-extrabold text-ink">ยังไม่ได้เพิ่มใบขับขี่</p>
              <p className="text-sm text-ink-2">เพิ่มไว้เพื่อให้ระบบเตือนก่อนวันหมดอายุ</p>
              <Link
                href="/profile/driving-license"
                className="mt-1 flex items-center justify-center gap-1.5 rounded-list bg-cta p-3 text-sm font-extrabold text-surface"
              >
                <Plus className="size-4" />
                เพิ่มใบขับขี่
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-3.5 rounded-card bg-surface-card p-5.5">
            <p className="font-mono text-xs text-ink-muted">สรุปการใช้งาน</p>
            {usageSummary ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-bold text-ink-3">รถ</p>
                    <p className="font-mono text-2xl text-ink">{usageSummary.vehicleCount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-3">บันทึกทั้งหมด</p>
                    <p className="font-mono text-2xl text-ink">{usageSummary.totalLogs}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-3">ตรงเวลา</p>
                    <p className="font-mono text-2xl text-ink">
                      {usageSummary.onTimeRate !== null ? `${usageSummary.onTimeRate}%` : "—"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-ink-3">
                  ค่าใช้จ่ายรวม{" "}
                  <span className="font-mono font-bold text-ink">
                    <span className="font-sans">฿ </span>
                    {usageSummary.totalCost.toLocaleString("th-TH")}
                  </span>{" "}
                  · เฉลี่ย{" "}
                  <span className="font-mono font-bold text-ink">
                    <span className="font-sans">฿ </span>
                    {usageSummary.avgCostPerMonth.toLocaleString("th-TH")}
                  </span>
                  /เดือน
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-5 animate-spin text-ink-muted" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 rounded-card bg-surface-card p-5.5">
            <h2 className="mb-1.5 text-lg font-extrabold text-ink">ข้อมูลของฉัน</h2>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!details}
              className="flex items-center justify-between gap-3 py-2.5 text-left disabled:opacity-50"
            >
              <span className="text-[15px] font-bold text-ink">ส่งออกข้อมูลทั้งหมด</span>
              <span className="flex shrink-0 items-center gap-1.5 rounded-button border border-line-strong px-3.5 py-2 text-sm font-bold text-ink">
                <Download className="size-3.5" />
                CSV
              </span>
            </button>
            <div className="border-t border-line" />
            <div className="flex items-center justify-between gap-3 pt-2.5">
              <span className="text-[15px] font-bold text-ink">ลบบัญชี</span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="text-xs font-bold text-ink-faint">เร็วๆ นี้</span>
                <button
                  type="button"
                  disabled
                  className="rounded-button border-[1.5px] border-flag-overdue px-3.5 py-2 text-sm font-bold text-flag-overdue opacity-55"
                >
                  ลบบัญชี
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
