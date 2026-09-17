import { authenticateRequest } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";
import { vehicleDocumentSchema } from "@/lib/validations/document";
import { deleteDocumentFileByUrl } from "@/lib/supabase/storage";

type Params = { params: Promise<{ id: string; docId: string }> };

/** PUT /api/vehicles/[id]/documents/[docId] — update.
 * Body: { file_url, ...vehicleDocumentSchema fields }. */
export async function PUT(request: Request, { params }: Params) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;
  const { docId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const { file_url, ...fields } = (body ?? {}) as Record<string, unknown>;
  const parsed = vehicleDocumentSchema.safeParse(fields);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      document_type: parsed.data.document_type,
      issue_date: parsed.data.issue_date || null,
      expiry_date: parsed.data.expiry_date,
      policy_number: parsed.data.policy_number || null,
      cost: parsed.data.cost ?? null,
      file_url: typeof file_url === "string" ? file_url : null,
    })
    .eq("id", docId)
    .select()
    .single();

  if (error || !data) return fail("ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์แก้ไข", 404);
  return ok(data, "updated");
}

/** DELETE /api/vehicles/[id]/documents/[docId] */
export async function DELETE(request: Request, { params }: Params) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;
  const { docId } = await params;

  const { data: existing } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", docId)
    .single();

  const { error } = await supabase.from("documents").delete().eq("id", docId);
  if (error) return fail(`ลบไม่สำเร็จ: ${error.message}`, 500);

  if (existing?.file_url) {
    await deleteDocumentFileByUrl(supabase, existing.file_url);
  }

  return ok(null, "deleted");
}
