import { authenticateRequest } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";
import { vehicleSchema } from "@/lib/validations/vehicle";
import { deleteVehicleImageByUrl } from "@/lib/supabase/storage";

/** GET /api/vehicles/[id] — one vehicle plus its maintenance logs and documents. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;
  const { id } = await params;

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (vehicleError || !vehicle) return fail("ไม่พบข้อมูลรถ หรือคุณไม่มีสิทธิ์", 404);

  const { data: logs } = await supabase
    .from("maintenance_logs")
    .select("*, maintenance_types(name, icon, default_interval_km)")
    .eq("vehicle_id", id)
    .order("service_date", { ascending: false });

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("vehicle_id", id)
    .order("expiry_date", { ascending: true });

  return ok({ vehicle, logs: logs ?? [], documents: documents ?? [] });
}

/** PUT /api/vehicles/[id] — update. Body: { image_url, ...vehicleSchema fields }. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const { image_url, ...fields } = (body ?? {}) as Record<string, unknown>;
  const parsed = vehicleSchema.safeParse(fields);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data, error } = await supabase
    .from("vehicles")
    .update({
      name: parsed.data.name,
      brand: parsed.data.brand,
      model: parsed.data.model,
      year: parsed.data.year ?? null,
      license_plate: parsed.data.license_plate || null,
      current_mileage: parsed.data.current_mileage,
      image_url: typeof image_url === "string" ? image_url : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return fail("ไม่พบข้อมูลรถ หรือคุณไม่มีสิทธิ์แก้ไข", 404);
  return ok(data, "updated");
}

/** DELETE /api/vehicles/[id] — delete the vehicle and its stored image. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;
  const { id } = await params;

  const { data: existing } = await supabase
    .from("vehicles")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) return fail(`ลบไม่สำเร็จ: ${error.message}`, 500);

  if (existing?.image_url) {
    await deleteVehicleImageByUrl(supabase, existing.image_url);
  }

  return ok(null, "deleted");
}
