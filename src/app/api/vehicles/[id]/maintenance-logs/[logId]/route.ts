import { authenticateRequest } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";
import { maintenanceLogSchema } from "@/lib/validations/maintenance-log";
import { syncVehicleMileage } from "@/lib/api/maintenance";
import { deleteReceiptImageByUrl } from "@/lib/supabase/storage";

type Params = { params: Promise<{ id: string; logId: string }> };

/** PUT /api/vehicles/[id]/maintenance-logs/[logId] — update.
 * Body: { receipt_url, ...maintenanceLogSchema fields }. */
export async function PUT(request: Request, { params }: Params) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;
  const { id: vehicleId, logId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const { receipt_url, ...fields } = (body ?? {}) as Record<string, unknown>;
  const parsed = maintenanceLogSchema.safeParse(fields);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
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
      receipt_image_url: typeof receipt_url === "string" ? receipt_url : null,
    })
    .eq("id", logId)
    .eq("vehicle_id", vehicleId)
    .select()
    .single();

  if (error || !data) return fail("ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์แก้ไข", 404);

  await syncVehicleMileage(supabase, vehicleId, parsed.data.mileage_at_service);

  return ok(data, "updated");
}

/** DELETE /api/vehicles/[id]/maintenance-logs/[logId] */
export async function DELETE(request: Request, { params }: Params) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;
  const { id: vehicleId, logId } = await params;

  const { data: existing } = await supabase
    .from("maintenance_logs")
    .select("receipt_image_url")
    .eq("id", logId)
    .eq("vehicle_id", vehicleId)
    .single();
  if (!existing) return fail("ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์ลบ", 404);

  const { error } = await supabase
    .from("maintenance_logs")
    .delete()
    .eq("id", logId)
    .eq("vehicle_id", vehicleId);
  if (error) return fail(`ลบไม่สำเร็จ: ${error.message}`, 500);

  if (existing?.receipt_image_url) {
    await deleteReceiptImageByUrl(supabase, existing.receipt_image_url);
  }

  return ok(null, "deleted");
}
