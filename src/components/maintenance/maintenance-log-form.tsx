"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2, Paperclip, Sparkles } from "lucide-react";
import { cn } from "cn";

import {
  maintenanceLogSchema,
  type MaintenanceLogFormValues,
  type MaintenanceLogInput,
} from "@/lib/validations/maintenance-log";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/validations/vehicle";
import { apiFetch } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { uploadReceiptImage, deleteReceiptImageByUrl } from "@/lib/supabase/storage";
import { FormField, fieldInputClassName } from "@/components/redesign/form-field";
import { Button } from "@/components/redesign/button";
import type { MaintenanceLog, MaintenanceType } from "@/types/database.types";

export function MaintenanceLogForm({
  vehicleId,
  maintenanceTypes,
  defaultMileage,
  log,
}: {
  vehicleId: string;
  maintenanceTypes: MaintenanceType[];
  defaultMileage: number;
  log?: MaintenanceLog;
}) {
  const router = useRouter();
  const isEdit = Boolean(log);
  const [formError, setFormError] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(
    log?.receipt_image_url ? "แนบไฟล์เดิมไว้แล้ว" : null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  // See vehicle-form.tsx — guards against a double-click slipping past
  // isSubmitting before React has re-rendered the disabled button.
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceLogFormValues, unknown, MaintenanceLogInput>({
    resolver: zodResolver(maintenanceLogSchema),
    defaultValues: log
      ? {
          maintenance_type_id: log.maintenance_type_id,
          service_date: log.service_date,
          mileage_at_service: log.mileage_at_service,
          cost: log.cost ?? undefined,
          shop_name: log.shop_name ?? "",
          notes: log.notes ?? "",
        }
      : {
          maintenance_type_id: "",
          service_date: new Date().toISOString().slice(0, 10),
          mileage_at_service: defaultMileage,
        },
  });

  const selectedType = maintenanceTypes.find((t) => t.id === watch("maintenance_type_id"));
  const mileageValue = Number(watch("mileage_at_service")) || 0;
  const previewMileage = selectedType?.default_interval_km
    ? mileageValue + selectedType.default_interval_km
    : null;

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
    const logId = log?.id ?? crypto.randomUUID();
    let receiptUrl = log?.receipt_image_url ?? null;

    // Upload straight from the browser to Supabase Storage instead of
    // routing the file through the Server Action below — see vehicle-form.tsx.
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
      if (log?.receipt_image_url) {
        await deleteReceiptImageByUrl(supabase, log.receipt_image_url);
      }
    }

    const payload = {
      id: logId,
      maintenance_type_id: values.maintenance_type_id,
      service_date: values.service_date,
      mileage_at_service: values.mileage_at_service,
      cost: values.cost,
      shop_name: values.shop_name,
      notes: values.notes,
      receipt_url: receiptUrl,
    };

    const result = isEdit
      ? await apiFetch(`/api/vehicles/${vehicleId}/maintenance-logs/${log!.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await apiFetch(`/api/vehicles/${vehicleId}/maintenance-logs`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

    if (result.error) {
      setFormError(result.error);
      return;
    }

    router.push(`/vehicles/${vehicleId}`);
    router.refresh();
  }

  // Guard at the raw submit event, not inside onSubmit — see vehicle-form.tsx.
  function guardedSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    void handleSubmit(onSubmit)(e).finally(() => {
      submittingRef.current = false;
    });
  }

  return (
    <form onSubmit={guardedSubmit} className="flex flex-col gap-3.5" noValidate>
      <FormField
        label="ประเภทงาน"
        htmlFor="maintenance_type_id"
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
            id="maintenance_type_id"
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

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="วันที่เข้ารับบริการ" htmlFor="service_date" error={errors.service_date?.message}>
          <input
            id="service_date"
            type="date"
            className={cn(fieldInputClassName({ invalid: !!errors.service_date }), "font-mono")}
            {...register("service_date")}
          />
        </FormField>
        <FormField
          label="เลขไมล์ (กม.)"
          htmlFor="mileage_at_service"
          error={errors.mileage_at_service?.message}
        >
          <input
            id="mileage_at_service"
            type="number"
            inputMode="numeric"
            className={cn(fieldInputClassName({ invalid: !!errors.mileage_at_service }), "font-mono")}
            {...register("mileage_at_service")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField
          label={
            <>
              ค่าใช้จ่าย <span className="font-normal text-ink-faint">(ไม่บังคับ)</span>
            </>
          }
          htmlFor="cost"
          error={errors.cost?.message}
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.75 -translate-y-1/2 text-sm font-bold text-ink-muted">
              ฿
            </span>
            <input
              id="cost"
              type="number"
              inputMode="numeric"
              placeholder="0"
              className={cn(fieldInputClassName(), "pl-8 font-mono")}
              {...register("cost")}
            />
          </div>
        </FormField>
        <FormField label="ร้าน/อู่">
          <input
            id="shop_name"
            placeholder="เช่น อู่ป้าแดง"
            className={fieldInputClassName()}
            {...register("shop_name")}
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
          className="flex h-20.5 w-full flex-col items-center justify-center gap-1 rounded-list border-[1.5px] border-dashed border-line-dash bg-surface text-center"
        >
          <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink">
            <Paperclip className="size-4" />
            {receiptName ?? "แตะเพื่อแนบรูปใบเสร็จ"}
          </span>
          <span className="font-mono text-[11px] text-ink-faint">
            อัปโหลดตรงขึ้น storage · สูงสุด 5MB
          </span>
        </button>
        {receiptError && <p className="mt-1.5 text-xs font-bold text-flag-overdue">{receiptError}</p>}
      </FormField>

      <FormField label="บันทึกเพิ่มเติม">
        <textarea
          id="notes"
          rows={3}
          placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
          className={cn(fieldInputClassName(), "min-h-11 resize-none")}
          {...register("notes")}
        />
      </FormField>

      {previewMileage !== null && (
        <div className="flex gap-3 rounded-list bg-cta-soft p-3.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-icon bg-cta text-surface">
            <Sparkles className="size-4" />
          </div>
          <p className="text-[13px] leading-relaxed text-ink-2">
            ระบบจะคำนวณรอบถัดไปให้อัตโนมัติ และอัปเดตเลขไมล์ของรถให้ตรงกัน (
            {mileageValue.toLocaleString("th-TH")} + {selectedType!.default_interval_km!.toLocaleString("th-TH")} ={" "}
            <span className="font-mono font-bold">{previewMileage.toLocaleString("th-TH")} กม.</span>)
          </p>
        </div>
      )}

      {formError && <p className="text-sm font-bold text-flag-overdue">{formError}</p>}

      <div className="mt-1 flex gap-2.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-15 shrink-0 rounded-button border border-line-strong text-sm font-extrabold text-ink"
        >
          ยกเลิก
        </button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isEdit ? "บันทึกการแก้ไข" : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}
