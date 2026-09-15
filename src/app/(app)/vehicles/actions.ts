"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteVehicleImageByUrl } from "@/lib/supabase/storage";
import { vehicleSchema } from "@/lib/validations/vehicle";

type ActionResult = { error: string } | undefined;

function parseVehicleFormData(formData: FormData) {
  return vehicleSchema.safeParse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    license_plate: formData.get("license_plate"),
    current_mileage: formData.get("current_mileage"),
  });
}

// Server Actions bypass proxy.ts entirely (see CLAUDE.md), so every action
// re-checks auth itself — RLS is the real backstop either way.
//
// Image files are uploaded client-side straight to Supabase Storage (see
// vehicle-form.tsx) instead of through this action: Vercel hard-caps a
// Serverless Function's request body at 4.5MB regardless of Next.js config,
// so a multi-MB phone photo sent as part of the FormData here would always
// come back 413 with no useful error surfaced to the user. The action only
// ever receives the resulting id/URL as plain text fields now.
export async function createVehicle(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = parseVehicleFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const vehicleId = formData.get("id");
  if (typeof vehicleId !== "string" || !vehicleId) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }
  const imageUrl = (formData.get("image_url") as string) || null;

  const { error } = await supabase.from("vehicles").insert({
    id: vehicleId,
    user_id: user.id,
    name: parsed.data.name,
    brand: parsed.data.brand,
    model: parsed.data.model,
    year: parsed.data.year ?? null,
    license_plate: parsed.data.license_plate || null,
    current_mileage: parsed.data.current_mileage,
    image_url: imageUrl,
  });

  if (error) return { error: `บันทึกไม่สำเร็จ: ${error.message}` };

  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function updateVehicle(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = parseVehicleFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const imageUrl = (formData.get("image_url") as string) || null;

  const { data, error } = await supabase
    .from("vehicles")
    .update({
      name: parsed.data.name,
      brand: parsed.data.brand,
      model: parsed.data.model,
      year: parsed.data.year ?? null,
      license_plate: parsed.data.license_plate || null,
      current_mileage: parsed.data.current_mileage,
      image_url: imageUrl,
    })
    .eq("id", vehicleId)
    .select()
    .single();

  if (error || !data) return { error: "ไม่พบข้อมูลรถ หรือคุณไม่มีสิทธิ์แก้ไข" };

  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function deleteVehicle(vehicleId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const { data: existing } = await supabase
    .from("vehicles")
    .select("image_url")
    .eq("id", vehicleId)
    .single();

  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
  if (error) return { error: `ลบไม่สำเร็จ: ${error.message}` };

  if (existing?.image_url) {
    await deleteVehicleImageByUrl(supabase, existing.image_url);
  }

  revalidatePath("/vehicles");
}
