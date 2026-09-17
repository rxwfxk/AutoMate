import { authenticateRequest } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";
import { vehicleSchema } from "@/lib/validations/vehicle";

/** GET /api/vehicles — list the caller's own vehicles. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return fail(error.message, 500);
  return ok(data);
}

/** POST /api/vehicles — create a vehicle. Body: { id, image_url, ...vehicleSchema fields }. */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { user, supabase } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const { id, image_url, ...fields } = (body ?? {}) as Record<string, unknown>;
  if (typeof id !== "string" || !id) {
    return fail("Missing required field: id", 400);
  }

  const parsed = vehicleSchema.safeParse(fields);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      id,
      user_id: user.id,
      name: parsed.data.name,
      brand: parsed.data.brand,
      model: parsed.data.model,
      year: parsed.data.year ?? null,
      license_plate: parsed.data.license_plate || null,
      current_mileage: parsed.data.current_mileage,
      image_url: typeof image_url === "string" ? image_url : null,
    })
    .select()
    .single();

  if (error || !data) return fail(error?.message ?? "CannotCreate", 500);
  return ok(data, "created", 201);
}
