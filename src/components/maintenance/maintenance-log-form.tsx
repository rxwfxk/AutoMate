"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Paperclip } from "lucide-react";

import {
  maintenanceLogSchema,
  type MaintenanceLogFormValues,
  type MaintenanceLogInput,
} from "@/lib/validations/maintenance-log";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/validations/vehicle";
import {
  createMaintenanceLog,
  updateMaintenanceLog,
} from "@/app/(app)/vehicles/[id]/maintenance/actions";
import { getMaintenanceIcon } from "@/lib/maintenance-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    control,
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
          // Give the Select a defined value from the first render — Base UI
          // warns if it flips from uncontrolled (undefined) to controlled.
          maintenance_type_id: "",
          service_date: new Date().toISOString().slice(0, 10),
          mileage_at_service: defaultMileage,
        },
  });

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
    const formData = new FormData();
    formData.set("maintenance_type_id", values.maintenance_type_id);
    formData.set("service_date", values.service_date);
    formData.set("mileage_at_service", String(values.mileage_at_service));
    formData.set("cost", values.cost !== undefined ? String(values.cost) : "");
    formData.set("shop_name", values.shop_name ?? "");
    formData.set("notes", values.notes ?? "");
    if (receiptFile) formData.set("receipt", receiptFile);

    const result = isEdit
      ? await updateMaintenanceLog(log!.id, vehicleId, formData)
      : await createMaintenanceLog(vehicleId, formData);

    if (result?.error) setFormError(result.error);
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
    <form onSubmit={guardedSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="maintenance_type_id">ประเภทงาน</Label>
        <Controller
          name="maintenance_type_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="maintenance_type_id" className="w-full">
                <SelectValue placeholder="เลือกประเภทงาน">
                  {(value: string | null) =>
                    maintenanceTypes.find((t) => t.id === value)?.name ?? "เลือกประเภทงาน"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {maintenanceTypes.map((type) => {
                  const Icon = getMaintenanceIcon(type.icon);
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      <Icon className="size-4 text-muted-foreground" />
                      {type.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        />
        {errors.maintenance_type_id && (
          <p className="text-sm text-flag-red">{errors.maintenance_type_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="service_date">วันที่ทำ</Label>
          <Input id="service_date" type="date" {...register("service_date")} />
          {errors.service_date && (
            <p className="text-sm text-flag-red">{errors.service_date.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="mileage_at_service">เลขไมล์ตอนทำ (กม.)</Label>
          <Input
            id="mileage_at_service"
            type="number"
            inputMode="numeric"
            className="font-mono"
            {...register("mileage_at_service")}
          />
          {errors.mileage_at_service && (
            <p className="text-sm text-flag-red">{errors.mileage_at_service.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cost">ค่าใช้จ่าย (บาท)</Label>
          <Input
            id="cost"
            type="number"
            inputMode="numeric"
            className="font-mono"
            placeholder="0"
            {...register("cost")}
          />
          {errors.cost && <p className="text-sm text-flag-red">{errors.cost.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="shop_name">ร้าน/อู่</Label>
          <Input id="shop_name" placeholder="เช่น อู่ป้าแดง" {...register("shop_name")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">หมายเหตุ</Label>
        <Textarea id="notes" rows={3} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" {...register("notes")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>รูปใบเสร็จ</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleReceiptChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip />
          {receiptName ?? "แนบรูปใบเสร็จ"}
        </Button>
        {receiptError && <p className="text-sm text-flag-red">{receiptError}</p>}
      </div>

      {formError && <p className="text-sm text-flag-red">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isEdit ? "บันทึกการแก้ไข" : "บันทึก"}
      </Button>
    </form>
  );
}
