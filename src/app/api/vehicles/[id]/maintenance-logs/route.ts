import { authenticateRequest } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";
import { maintenanceLogSchema } from "@/lib/validations/maintenance-log";
import { syncVehicleMileage } from "@/lib/api/maintenance";

/** POST /api/vehicles/[id]/maintenance-logs — create a log entry.
 * Body: { id, receipt_url, ...maintenanceLogSchema fields }. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;
  const { id: vehicleId } = await params;

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .single();
  if (!vehicle) return fail("ไม่พบข้อมูลรถ หรือคุณไม่มีสิทธิ์", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const { id, receipt_url, ...fields } = (body ?? {}) as Record<string, unknown>;
  if (typeof id !== "string" || !id) {
    return fail("Missing required field: id", 400);
  }

  const parsed = maintenanceLogSchema.safeParse(fields);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data, error } = await supabase
    .from("maintenance_logs")
    .insert({
      id,
      vehicle_id: vehicleId,
      maintenance_type_id: parsed.data.maintenance_type_id,
      service_date: parsed.data.service_date,
      mileage_at_service: parsed.data.mileage_at_service,
      cost: parsed.data.cost ?? null,
      shop_name: parsed.data.shop_name || null,
      notes: parsed.data.notes || null,
      receipt_image_url: typeof receipt_url === "string" ? receipt_url : null,
    })
    .select()
    .single();

  if (error || !data) return fail(`บันทึกไม่สำเร็จ: ${error?.message ?? ""}`, 500);

  await syncVehicleMileage(supabase, vehicleId, parsed.data.mileage_at_service);

  return ok(data, "created", 201);
}
