import { authenticateRequest } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";
import { vehicleDocumentSchema } from "@/lib/validations/document";

/** POST /api/vehicles/[id]/documents — create a vehicle-scoped document
 * (พ.ร.บ./ประกัน/ภาษี). Body: { id, file_url, ...vehicleDocumentSchema fields }. */
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

  const { id, file_url, ...fields } = (body ?? {}) as Record<string, unknown>;
  if (typeof id !== "string" || !id) {
    return fail("Missing required field: id", 400);
  }

  const parsed = vehicleDocumentSchema.safeParse(fields);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id,
      vehicle_id: vehicleId,
      document_type: parsed.data.document_type,
      issue_date: parsed.data.issue_date || null,
      expiry_date: parsed.data.expiry_date,
      policy_number: parsed.data.policy_number || null,
      cost: parsed.data.cost ?? null,
      file_url: typeof file_url === "string" ? file_url : null,
    })
    .select()
    .single();

  if (error || !data) return fail(`บันทึกไม่สำเร็จ: ${error?.message ?? ""}`, 500);
  return ok(data, "created", 201);
}
