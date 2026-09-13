"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uploadReceiptImage, deleteReceiptImageByUrl } from "@/lib/supabase/storage";
import { maintenanceLogSchema } from "@/lib/validations/maintenance-log";

type ActionResult = { error: string } | undefined;

function parseLogFormData(formData: FormData) {
  return maintenanceLogSchema.safeParse({
    maintenance_type_id: formData.get("maintenance_type_id"),
    service_date: formData.get("service_date"),
    mileage_at_service: formData.get("mileage_at_service"),
    cost: formData.get("cost"),
    shop_name: formData.get("shop_name"),
    notes: formData.get("notes"),
  });
}

/** Keeps the vehicle's odometer in sync with the latest logged service —
 * never decreases it automatically, only bumps it forward. */
async function syncVehicleMileage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
  loggedMileage: number,
) {
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("current_mileage")
    .eq("id", vehicleId)
    .single();

  if (vehicle && loggedMileage > vehicle.current_mileage) {
    await supabase
      .from("vehicles")
      .update({ current_mileage: loggedMileage })
      .eq("id", vehicleId);
  }
}

// Server Actions bypass proxy.ts (see CLAUDE.md) — every action re-checks
// auth and relies on RLS (vehicle ownership) as the real backstop.
export async function createMaintenanceLog(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = parseLogFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .single();
  if (!vehicle) return { error: "ไม่พบข้อมูลรถ หรือคุณไม่มีสิทธิ์" };

  const logId = randomUUID();
  const receiptFile = formData.get("receipt");
  let receiptUrl: string | null = null;

  if (receiptFile instanceof File && receiptFile.size > 0) {
    try {
      receiptUrl = await uploadReceiptImage(supabase, user.id, logId, receiptFile);
    } catch {
      return { error: "อัปโหลดรูปใบเสร็จไม่สำเร็จ กรุณาลองใหม่" };
    }
  }

  const { error } = await supabase.from("maintenance_logs").insert({
    id: logId,
    vehicle_id: vehicleId,
    maintenance_type_id: parsed.data.maintenance_type_id,
    service_date: parsed.data.service_date,
    mileage_at_service: parsed.data.mileage_at_service,
    cost: parsed.data.cost ?? null,
    shop_name: parsed.data.shop_name || null,
    notes: parsed.data.notes || null,
    receipt_image_url: receiptUrl,
  });

  if (error) return { error: `บันทึกไม่สำเร็จ: ${error.message}` };

  await syncVehicleMileage(supabase, vehicleId, parsed.data.mileage_at_service);

  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/vehicles");
  redirect(`/vehicles/${vehicleId}`);
}

export async function updateMaintenanceLog(
  logId: string,
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = parseLogFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { data: existing } = await supabase
    .from("maintenance_logs")
    .select("receipt_image_url")
    .eq("id", logId)
    .single();

  const receiptFile = formData.get("receipt");
  let receiptUrl = existing?.receipt_image_url ?? null;

  if (receiptFile instanceof File && receiptFile.size > 0) {
    try {
      receiptUrl = await uploadReceiptImage(supabase, user.id, logId, receiptFile);
    } catch {
      return { error: "อัปโหลดรูปใบเสร็จไม่สำเร็จ กรุณาลองใหม่" };
    }
    if (existing?.receipt_image_url) {
      await deleteReceiptImageByUrl(supabase, existing.receipt_image_url);
    }
  }

  const { data, error } = await supabase
    .from("maintenance_logs")
    .update({
      maintenance_type_id: parsed.data.maintenance_type_id,
      service_date: parsed.data.service_date,
      mileage_at_service: parsed.data.mileage_at_service,
      cost: parsed.data.cost ?? null,
      shop_name: parsed.data.shop_name || null,
      notes: parsed.data.notes || null,
      receipt_image_url: receiptUrl,
    })
    .eq("id", logId)
    .select()
    .single();

  if (error || !data) return { error: "ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์แก้ไข" };

  await syncVehicleMileage(supabase, vehicleId, parsed.data.mileage_at_service);

  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/vehicles");
  redirect(`/vehicles/${vehicleId}`);
}

export async function deleteMaintenanceLog(
  logId: string,
  vehicleId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const { data: existing } = await supabase
    .from("maintenance_logs")
    .select("receipt_image_url")
    .eq("id", logId)
    .single();

  const { error } = await supabase.from("maintenance_logs").delete().eq("id", logId);
  if (error) return { error: `ลบไม่สำเร็จ: ${error.message}` };

  if (existing?.receipt_image_url) {
    await deleteReceiptImageByUrl(supabase, existing.receipt_image_url);
  }

  revalidatePath(`/vehicles/${vehicleId}`);
}
