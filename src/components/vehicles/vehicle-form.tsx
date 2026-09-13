"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";

import {
  vehicleSchema,
  type VehicleFormValues,
  type VehicleInput,
  MAX_IMAGE_SIZE_BYTES,
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/validations/vehicle";
import { createVehicle, updateVehicle } from "@/app/(app)/vehicles/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Vehicle } from "@/types/database.types";

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const isEdit = Boolean(vehicle);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(vehicle?.image_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues, unknown, VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          name: vehicle.name,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year ?? undefined,
          license_plate: vehicle.license_plate ?? "",
          current_mileage: vehicle.current_mileage,
        }
      : { current_mileage: 0 },
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function onSubmit(values: VehicleInput) {
    setFormError(null);
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("brand", values.brand);
    formData.set("model", values.model);
    if (values.year !== undefined) formData.set("year", String(values.year));
    formData.set("license_plate", values.license_plate ?? "");
    formData.set("current_mileage", String(values.current_mileage));
    if (imageFile) formData.set("image", imageFile);

    const result = isEdit
      ? await updateVehicle(vehicle!.id, formData)
      : await createVehicle(formData);

    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col items-center gap-3">
        {/* Plain <img>, not next/image — the pre-upload preview is a local
            blob: URL that image optimization can't serve. */}
        <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <Upload className="size-8 text-muted-foreground" />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleImageChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {previewUrl ? "เปลี่ยนรูป" : "เพิ่มรูปรถ"}
        </Button>
        {imageError && <p className="text-sm text-flag-red">{imageError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">ชื่อเล่นรถ</Label>
        <Input id="name" placeholder="เช่น เจ้าดำ" {...register("name")} />
        {errors.name && <p className="text-sm text-flag-red">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand">ยี่ห้อ</Label>
          <Input id="brand" placeholder="Honda" {...register("brand")} />
          {errors.brand && <p className="text-sm text-flag-red">{errors.brand.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="model">รุ่น</Label>
          <Input id="model" placeholder="Wave 110i" {...register("model")} />
          {errors.model && <p className="text-sm text-flag-red">{errors.model.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="year">ปีรถ (ค.ศ.)</Label>
          <Input
            id="year"
            type="number"
            inputMode="numeric"
            className="font-mono"
            placeholder="2024"
            {...register("year")}
          />
          {errors.year && <p className="text-sm text-flag-red">{errors.year.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="license_plate">ทะเบียน</Label>
          <Input id="license_plate" placeholder="1กก 1234" {...register("license_plate")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="current_mileage">เลขไมล์ปัจจุบัน (กม.)</Label>
        <Input
          id="current_mileage"
          type="number"
          inputMode="numeric"
          className="font-mono"
          placeholder="0"
          {...register("current_mileage")}
        />
        {errors.current_mileage && (
          <p className="text-sm text-flag-red">{errors.current_mileage.message}</p>
        )}
      </div>

      {formError && <p className="text-sm text-flag-red">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isEdit ? "บันทึกการแก้ไข" : "เพิ่มรถ"}
      </Button>
    </form>
  );
}
