"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { apiFetch } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { uploadVehicleImage, deleteVehicleImageByUrl } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <form onSubmit={guardedSubmit} className="flex flex-col gap-4" noValidate>
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
