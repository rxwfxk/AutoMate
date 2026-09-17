import { authenticateRequest } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";
import { drivingLicenseSchema } from "@/lib/validations/document";
import { deleteDocumentFileByUrl } from "@/lib/supabase/storage";

/** Driving licenses are one row per user (documents.user_id, document_type =
 * "driving_license"), so no id is needed in the URL — RLS plus this filter
 * already scope every operation to the caller's own row. */

/** GET /api/driving-license — the caller's license, or `{ document: null }`. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;

  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("document_type", "driving_license")
    .maybeSingle();

  return ok({ document: data ?? null });
}

/** POST /api/driving-license — create. Body: { id, file_url, ...drivingLicenseSchema fields }. */
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

  const { id, file_url, ...fields } = (body ?? {}) as Record<string, unknown>;
  if (typeof id !== "string" || !id) {
    return fail("Missing required field: id", 400);
  }

  const parsed = drivingLicenseSchema.safeParse(fields);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id,
      user_id: user.id,
      document_type: "driving_license",
      issue_date: parsed.data.issue_date || null,
      expiry_date: parsed.data.expiry_date,
      policy_number: parsed.data.policy_number || null,
      cost: parsed.data.cost ?? null,
      file_url: typeof file_url === "string" ? file_url : null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return fail("คุณมีข้อมูลใบขับขี่อยู่แล้ว กรุณาแก้ไขรายการเดิมแทน", 409);
    return fail(`บันทึกไม่สำเร็จ: ${error.message}`, 500);
  }

  return ok(data, "created", 201);
}

/** PUT /api/driving-license — update. Body: { file_url, ...drivingLicenseSchema fields }. */
export async function PUT(request: Request) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const { file_url, ...fields } = (body ?? {}) as Record<string, unknown>;
  const parsed = drivingLicenseSchema.safeParse(fields);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      issue_date: parsed.data.issue_date || null,
      expiry_date: parsed.data.expiry_date,
      policy_number: parsed.data.policy_number || null,
      cost: parsed.data.cost ?? null,
      file_url: typeof file_url === "string" ? file_url : null,
    })
    .eq("document_type", "driving_license")
    .select()
    .single();

  if (error || !data) return fail("ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์แก้ไข", 404);
  return ok(data, "updated");
}

/** DELETE /api/driving-license */
export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;

  const { data: existing } = await supabase
    .from("documents")
    .select("file_url")
    .eq("document_type", "driving_license")
    .maybeSingle();

  const { error } = await supabase.from("documents").delete().eq("document_type", "driving_license");
  if (error) return fail(`ลบไม่สำเร็จ: ${error.message}`, 500);

  if (existing?.file_url) {
    await deleteDocumentFileByUrl(supabase, existing.file_url);
  }

  return ok(null, "deleted");
}
