"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2, Paperclip } from "lucide-react";
import { cn } from "cn";

import {
  maintenanceLogSchema,
  type MaintenanceLogFormValues,
  type MaintenanceLogInput,
} from "@/lib/validations/maintenance-log";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/validations/vehicle";
import { apiFetch } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { uploadReceiptImage } from "@/lib/supabase/storage";
import { FormField, fieldInputClassName } from "@/components/redesign/form-field";
import { Button, buttonVariants } from "@/components/redesign/button";
import { Chip } from "@/components/redesign/chip";
import type { MaintenanceType } from "@/types/database.types";
import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";

/** Adds `months` to a YYYY-MM-DD date string, clamping the day to the target
 * month's length — mirrors the `date + 'N months'::interval` arithmetic the
 * `set_maintenance_next_due` Postgres trigger uses server-side (migration
 * 0001), so this live preview matches what the DB will actually store. */
function addMonthsClamped(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(d, daysInMonth);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatThaiDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Desktop 2-column layout for README's Screen 3c. A separate component from
 * `MaintenanceLogForm` (mobile) rather than a shared refactor — the "add"
 * page's mobile block must stay byte-for-byte untouched per this step's
 * rule, and the two layouts don't share enough markup to factor out without
 * touching that file. Submit/upload logic below is intentionally a copy of
 * the mobile form's, same trade-off already made for `getTopUrgentItems` vs
 * `getMostUrgentItem` in the vehicles-list step.
 */
export function MaintenanceLogFormDesktop({
  vehicleId,
  vehicleName,
  maintenanceTypes,
  defaultMileage,
  previousLogs,
}: {
  vehicleId: string;
  vehicleName: string;
  maintenanceTypes: MaintenanceType[];
  defaultMileage: number;
  previousLogs: MaintenanceLogWithType[];
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceLogFormValues, unknown, MaintenanceLogInput>({
    resolver: zodResolver(maintenanceLogSchema),
    defaultValues: {
      maintenance_type_id: "",
      service_date: new Date().toISOString().slice(0, 10),
      mileage_at_service: defaultMileage,
    },
  });

  const typeId = watch("maintenance_type_id");
  const selectedType = maintenanceTypes.find((t) => t.id === typeId);
  const mileageValue = Number(watch("mileage_at_service")) || 0;
  const serviceDate = watch("service_date") || new Date().toISOString().slice(0, 10);

  const nextDueMileage = selectedType?.default_interval_km
    ? mileageValue + selectedType.default_interval_km
    : null;
  const nextDueDate = selectedType?.default_interval_months
    ? addMonthsClamped(serviceDate, selectedType.default_interval_months)
    : null;

  const lastLogOfType = typeId
    ? [...previousLogs]
        .filter((l) => l.maintenance_type_id === typeId)
        .sort((a, b) => b.service_date.localeCompare(a.service_date))[0]
    : undefined;

  const recentShopName = [...previousLogs]
    .sort((a, b) => b.service_date.localeCompare(a.service_date))
    .find((l) => l.shop_name)?.shop_name;

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setReceiptError(null);
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setReceiptError("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setReceiptError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }

    setReceiptFile(file);
    setReceiptName(file.name);
  }

  async function onSubmit(values: MaintenanceLogInput) {
    setFormError(null);
    const logId = crypto.randomUUID();
    let receiptUrl: string | null = null;

    if (receiptFile) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setFormError("กรุณาเข้าสู่ระบบ");
        return;
      }
      try {
        receiptUrl = await uploadReceiptImage(supabase, user.id, logId, receiptFile);
      } catch {
        setFormError("อัปโหลดรูปใบเสร็จไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
    }

    const result = await apiFetch(`/api/vehicles/${vehicleId}/maintenance-logs`, {
      method: "POST",
      body: JSON.stringify({
        id: logId,
        maintenance_type_id: values.maintenance_type_id,
        service_date: values.service_date,
        mileage_at_service: values.mileage_at_service,
        cost: values.cost,
        shop_name: values.shop_name,
        notes: values.notes,
        receipt_url: receiptUrl,
      }),
    });

    if (result.error) {
      setFormError(result.error);
      return;
    }

    router.push(`/vehicles/${vehicleId}`);
    router.refresh();
  }

  function guardedSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    void handleSubmit(onSubmit)(e).finally(() => {
      submittingRef.current = false;
    });
  }

  return (
    <form onSubmit={guardedSubmit} className="flex gap-5" noValidate>
      {/* Left column — the form itself. */}
      <div className="flex flex-[1.6] flex-col gap-4.5 rounded-card bg-surface-card p-6">
        <div className="grid grid-cols-2 gap-4.5">
          <FormField label="รถ">
            <div className={cn(fieldInputClassName(), "bg-[#f6ece4] text-ink-muted")}>{vehicleName}</div>
          </FormField>
          <FormField
            label="ประเภทงาน"
            htmlFor="d_maintenance_type_id"
            required
            error={errors.maintenance_type_id?.message}
            hint={
              selectedType && (selectedType.default_interval_km || selectedType.default_interval_months)
                ? `รอบมาตรฐาน ${
                    selectedType.default_interval_km
                      ? `${selectedType.default_interval_km.toLocaleString("th-TH")} กม.`
                      : ""
                  }${selectedType.default_interval_km && selectedType.default_interval_months ? " หรือ " : ""}${
                    selectedType.default_interval_months ? `${selectedType.default_interval_months} เดือน` : ""
                  } (ถึงก่อนใช้ก่อน)`
                : undefined
            }
          >
            <div className="relative">
              <select
                id="d_maintenance_type_id"
                className={cn(
                  fieldInputClassName({ emphasized: true, invalid: !!errors.maintenance_type_id }),
                  "appearance-none pr-10",
                )}
                {...register("maintenance_type_id")}
              >
                <option value="" disabled>
                  เลือกประเภทงาน
                </option>
                {maintenanceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-muted" />
            </div>
          </FormField>
        </div>

        <div className="flex flex-wrap gap-2">
          {maintenanceTypes.map((type) => (
            <Chip
              key={type.id}
              selected={type.id === typeId}
              onClick={() => setValue("maintenance_type_id", type.id, { shouldValidate: true })}
            >
              {type.name}
            </Chip>
          ))}
        </div>

        <div className="border-t border-line" />

        <div className="grid grid-cols-3 gap-4.5">
          <FormField label="วันที่เข้ารับบริการ" htmlFor="d_service_date" error={errors.service_date?.message}>
            <input
              id="d_service_date"
              type="date"
              className={cn(fieldInputClassName(), "font-mono")}
              {...register("service_date")}
            />
          </FormField>
          <FormField
            label="เลขไมล์"
            htmlFor="d_mileage_at_service"
            error={errors.mileage_at_service?.message}
          >
            <div className="relative">
              <input
                id="d_mileage_at_service"
                type="number"
                inputMode="numeric"
                className={cn(fieldInputClassName(), "pr-12 font-mono")}
                {...register("mileage_at_service")}
              />
              <span className="pointer-events-none absolute top-1/2 right-3.75 -translate-y-1/2 text-sm font-bold text-ink-muted">
                กม.
              </span>
            </div>
          </FormField>
          <FormField
            label={
              <>
                ค่าใช้จ่าย <span className="font-normal text-ink-faint">(ไม่บังคับ)</span>
              </>
            }
            htmlFor="d_cost"
            error={errors.cost?.message}
          >
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.75 -translate-y-1/2 text-sm font-bold text-ink-muted">
                ฿
              </span>
              <input
                id="d_cost"
                type="number"
                inputMode="numeric"
                placeholder="0"
                className={cn(fieldInputClassName(), "pl-8 font-mono")}
                {...register("cost")}
              />
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4.5">
          <FormField
            label="ร้าน/อู่"
            htmlFor="d_shop_name"
            hint={
              recentShopName ? (
                <button
                  type="button"
                  onClick={() => setValue("shop_name", recentShopName)}
                  className="font-bold text-ink-3 underline decoration-line-dash"
                >
                  ใช้ล่าสุด: {recentShopName}
                </button>
              ) : undefined
            }
          >
            <input
              id="d_shop_name"
              placeholder="เช่น อู่ป้าแดง"
              className={fieldInputClassName()}
              {...register("shop_name")}
            />
          </FormField>
          <FormField label="บันทึกเพิ่มเติม" htmlFor="d_notes">
            <textarea
              id="d_notes"
              rows={2}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              className={cn(fieldInputClassName(), "min-h-16.5 resize-none")}
              {...register("notes")}
            />
          </FormField>
        </div>

        <FormField label="รูปใบเสร็จ">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={handleReceiptChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-27 w-full flex-col items-center justify-center gap-1 rounded-list border-[1.5px] border-dashed border-line-dash bg-surface text-center"
          >
            <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink">
              <Paperclip className="size-4" />
              {receiptName ?? "ลากไฟล์มาวาง หรือคลิกเพื่อเลือก"}
            </span>
            <span className="font-mono text-[11px] text-ink-faint">JPG · PNG · สูงสุด 5MB</span>
          </button>
          {receiptError && <p className="mt-1.5 text-xs font-bold text-flag-overdue">{receiptError}</p>}
        </FormField>
      </div>

      {/* Right column — live preview + submit. */}
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-card bg-ink p-5.5 text-surface">
          <p className="font-mono text-xs tracking-[0.12em] text-ink-faint uppercase">บันทึกแล้วจะเกิดอะไร</p>
          <div className="flex flex-col gap-3">
            {[
              "ระบบบันทึกงานนี้ลงประวัติของรถคันนี้",
              "คำนวณรอบถัดไปจากประเภทงานที่เลือก",
              "อัปเดตเลขไมล์ปัจจุบันของรถให้ตรงกัน (ถ้าสูงกว่าเดิม)",
            ].map((text, i) => (
              <div key={i} className="flex gap-3">
                <span className="shrink-0 font-mono text-[13px] font-bold text-cta">{i + 1}</span>
                <p className="text-[13px] leading-relaxed text-ink-faint">{text}</p>
              </div>
            ))}
          </div>
          {(nextDueMileage !== null || nextDueDate !== null) && (
            <>
              <div className="border-t border-ink-line" />
              <div className="grid grid-cols-2 gap-5">
                {nextDueMileage !== null && (
                  <div>
                    <p className="text-xs font-semibold text-ink-faint">ครบกำหนดที่</p>
                    <p className="font-mono text-xl">{nextDueMileage.toLocaleString("th-TH")} กม.</p>
                  </div>
                )}
                {nextDueDate !== null && (
                  <div>
                    <p className="text-xs font-semibold text-ink-faint">หรือวันที่</p>
                    <p className="font-mono text-xl">{formatThaiDate(nextDueDate)}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {lastLogOfType && (
          <div className="flex flex-col gap-2 rounded-card border border-cta-soft-line bg-cta-soft p-5">
            <p className="text-base font-extrabold text-ink">ครั้งล่าสุดของงานนี้</p>
            <p className="text-sm text-ink-2">
              {formatThaiDate(lastLogOfType.service_date)} ·{" "}
              <span className="font-mono font-bold">
                {lastLogOfType.mileage_at_service.toLocaleString("th-TH")} กม.
              </span>
              {lastLogOfType.shop_name ? ` · ${lastLogOfType.shop_name}` : ""}
            </p>
            <p className="text-sm text-ink-2">
              ห่างจากครั้งนี้{" "}
              <span className="font-mono font-bold">
                {Math.max(0, mileageValue - lastLogOfType.mileage_at_service).toLocaleString("th-TH")} กม.
              </span>{" "}
              ·{" "}
              <span className="font-mono font-bold">
                {Math.max(
                  0,
                  Math.round(
                    (new Date(serviceDate).getTime() - new Date(lastLogOfType.service_date).getTime()) /
                      (1000 * 60 * 60 * 24),
                  ),
                ).toLocaleString("th-TH")}{" "}
                วัน
              </span>
            </p>
          </div>
        )}

        {formError && <p className="text-sm font-bold text-flag-overdue">{formError}</p>}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className={buttonVariants({ variant: "outline", className: "flex-1" })}
          >
            ยกเลิก
          </button>
          <Button type="submit" disabled={isSubmitting} className="flex-[1.6]">
            {isSubmitting && <Loader2 className="animate-spin" />}
            บันทึก
          </Button>
        </div>
      </div>
    </form>
  );
}
