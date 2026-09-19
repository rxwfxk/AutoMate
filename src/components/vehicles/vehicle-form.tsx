"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { cn } from "cn";

import {
  vehicleSchema,
  type VehicleFormValues,
  type VehicleInput,
  MAX_IMAGE_SIZE_BYTES,
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/validations/vehicle";
import { apiFetch } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { uploadVehicleImage, deleteVehicleImageByUrl } from "@/lib/supabase/storage";
import { FormField, fieldInputClassName } from "@/components/redesign/form-field";
import { Button } from "@/components/redesign/button";
import type { Vehicle } from "@/types/database.types";

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const isEdit = Boolean(vehicle);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(vehicle?.image_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // RHF's isSubmitting flips true only after this render commits, so a second
  // click fired in the same tick as the first (before React disables the
  // button) can still slip through — guard synchronously with a ref instead.
  const submittingRef = useRef(false);

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
    const vehicleId = vehicle?.id ?? crypto.randomUUID();
    let imageUrl = vehicle?.image_url ?? null;

    // Upload straight from the browser to Supabase Storage instead of
    // routing the file through the Server Action below — Vercel hard-caps a
    // Serverless Function's request body at 4.5MB regardless of Next.js
    // config, so a multi-MB phone photo sent as FormData would always come
    // back 413 with the UI stuck on its loading spinner forever.
    if (imageFile) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setFormError("กรุณาเข้าสู่ระบบ");
        return;
      }

      try {
        imageUrl = await uploadVehicleImage(supabase, user.id, vehicleId, imageFile);
      } catch {
        setFormError("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      if (vehicle?.image_url) {
        await deleteVehicleImageByUrl(supabase, vehicle.image_url);
      }
    }

    const payload = {
      id: vehicleId,
      name: values.name,
      brand: values.brand,
      model: values.model,
      year: values.year,
      license_plate: values.license_plate,
      current_mileage: values.current_mileage,
      image_url: imageUrl,
    };

    const result = isEdit
      ? await apiFetch(`/api/vehicles/${vehicle!.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/vehicles", { method: "POST", body: JSON.stringify(payload) });

    if (result.error) {
      setFormError(result.error);
      return;
    }

    router.push("/vehicles");
    router.refresh();
  }

  // Guard at the raw submit event, not inside onSubmit — RHF's async
  // validation runs before onSubmit is called, so a second click can still
  // reach onSubmit after the first submission already finished and cleared
  // an in-onSubmit guard. Checking here, before validation starts, closes
  // that gap.
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
      <div className="flex flex-col items-center gap-3">
        {/* Plain <img>, not next/image — the pre-upload preview is a local
            blob: URL that image optimization can't serve. */}
        <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-line-strong bg-surface">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <Upload className="size-8 text-ink-faint" />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleImageChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-button border border-line-strong px-4 py-2 text-sm font-bold text-ink"
        >
          {previewUrl ? "เปลี่ยนรูป" : "เพิ่มรูปรถ"}
        </button>
        {imageError && <p className="text-xs font-bold text-flag-overdue">{imageError}</p>}
      </div>

      <FormField label="ชื่อเล่นรถ" htmlFor="name" error={errors.name?.message}>
        <input
          id="name"
          placeholder="เช่น เจ้าดำ"
          className={fieldInputClassName({ invalid: !!errors.name })}
          {...register("name")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="ยี่ห้อ" htmlFor="brand" error={errors.brand?.message}>
          <input
            id="brand"
            placeholder="Honda"
            className={fieldInputClassName({ invalid: !!errors.brand })}
            {...register("brand")}
          />
        </FormField>
        <FormField label="รุ่น" htmlFor="model" error={errors.model?.message}>
          <input
            id="model"
            placeholder="Wave 110i"
            className={fieldInputClassName({ invalid: !!errors.model })}
            {...register("model")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="ปีรถ (ค.ศ.)" htmlFor="year" error={errors.year?.message}>
          <input
            id="year"
            type="number"
            inputMode="numeric"
            placeholder="2024"
            className={cn(fieldInputClassName({ invalid: !!errors.year }), "font-mono")}
            {...register("year")}
          />
        </FormField>
        <FormField label="ทะเบียน" htmlFor="license_plate">
          <input
            id="license_plate"
            placeholder="1กก 1234"
            className={fieldInputClassName()}
            {...register("license_plate")}
          />
        </FormField>
      </div>

      <FormField label="เลขไมล์ปัจจุบัน (กม.)" htmlFor="current_mileage" error={errors.current_mileage?.message}>
        <input
          id="current_mileage"
          type="number"
          inputMode="numeric"
          placeholder="0"
          className={cn(fieldInputClassName({ invalid: !!errors.current_mileage }), "font-mono")}
          {...register("current_mileage")}
        />
      </FormField>

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
          {isEdit ? "บันทึกการแก้ไข" : "เพิ่มรถ"}
        </Button>
      </div>
    </form>
  );
}
