"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteDocumentFileByUrl } from "@/lib/supabase/storage";
import { vehicleDocumentSchema, drivingLicenseSchema } from "@/lib/validations/document";

type ActionResult = { error: string } | undefined;

function parseCommonFields(formData: FormData) {
  return {
    issue_date: formData.get("issue_date"),
    expiry_date: formData.get("expiry_date"),
    policy_number: formData.get("policy_number"),
    cost: formData.get("cost"),
  };
}

// Server Actions bypass proxy.ts (see CLAUDE.md) — every action re-checks
// auth itself; RLS (migration 0005's owner-matches-type policy) is the
// real backstop for the vehicle-vs-user ownership split.

// File uploads happen client-side straight to Supabase Storage (see
// vehicle-document-form.tsx / driving-license-form.tsx) instead of through
// these actions: Vercel hard-caps a Serverless Function's request body at
// 4.5MB regardless of Next.js config, so a multi-MB scan/photo sent as part
// of the FormData here would always come back 413 with no useful error
// surfaced to the user. The actions only ever receive the resulting
// id/URL as plain text fields now.
export async function createVehicleDocument(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = vehicleDocumentSchema.safeParse({
    document_type: formData.get("document_type"),
    ...parseCommonFields(formData),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .single();
  if (!vehicle) return { error: "ไม่พบข้อมูลรถ หรือคุณไม่มีสิทธิ์" };

  const docId = formData.get("id");
  if (typeof docId !== "string" || !docId) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }
  const fileUrl = (formData.get("file_url") as string) || null;

  const { error } = await supabase.from("documents").insert({
    id: docId,
    vehicle_id: vehicleId,
    document_type: parsed.data.document_type,
    issue_date: parsed.data.issue_date || null,
    expiry_date: parsed.data.expiry_date,
    policy_number: parsed.data.policy_number || null,
    cost: parsed.data.cost ?? null,
    file_url: fileUrl,
  });
  if (error) return { error: `บันทึกไม่สำเร็จ: ${error.message}` };

  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(`/vehicles/${vehicleId}`);
}

export async function updateVehicleDocument(
  docId: string,
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = vehicleDocumentSchema.safeParse({
    document_type: formData.get("document_type"),
    ...parseCommonFields(formData),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const fileUrl = (formData.get("file_url") as string) || null;

  const { data, error } = await supabase
    .from("documents")
    .update({
      document_type: parsed.data.document_type,
      issue_date: parsed.data.issue_date || null,
      expiry_date: parsed.data.expiry_date,
      policy_number: parsed.data.policy_number || null,
      cost: parsed.data.cost ?? null,
      file_url: fileUrl,
    })
    .eq("id", docId)
    .select()
    .single();

  if (error || !data) return { error: "ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์แก้ไข" };

  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(`/vehicles/${vehicleId}`);
}

export async function createDrivingLicense(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = drivingLicenseSchema.safeParse(parseCommonFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const docId = formData.get("id");
  if (typeof docId !== "string" || !docId) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }
  const fileUrl = (formData.get("file_url") as string) || null;

  const { error } = await supabase.from("documents").insert({
    id: docId,
    user_id: user.id,
    document_type: "driving_license",
    issue_date: parsed.data.issue_date || null,
    expiry_date: parsed.data.expiry_date,
    policy_number: parsed.data.policy_number || null,
    cost: parsed.data.cost ?? null,
    file_url: fileUrl,
  });
  if (error) {
    if (error.code === "23505") return { error: "คุณมีข้อมูลใบขับขี่อยู่แล้ว กรุณาแก้ไขรายการเดิมแทน" };
    return { error: `บันทึกไม่สำเร็จ: ${error.message}` };
  }

  revalidatePath("/profile");
  redirect("/profile");
}

export async function updateDrivingLicense(docId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const parsed = drivingLicenseSchema.safeParse(parseCommonFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const fileUrl = (formData.get("file_url") as string) || null;

  const { data, error } = await supabase
    .from("documents")
    .update({
      issue_date: parsed.data.issue_date || null,
      expiry_date: parsed.data.expiry_date,
      policy_number: parsed.data.policy_number || null,
      cost: parsed.data.cost ?? null,
      file_url: fileUrl,
    })
    .eq("id", docId)
    .select()
    .single();

  if (error || !data) return { error: "ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์แก้ไข" };

  revalidatePath("/profile");
  redirect("/profile");
}

export async function deleteDocument(docId: string, revalidateTarget: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const { data: existing } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", docId)
    .single();

  const { error } = await supabase.from("documents").delete().eq("id", docId);
  if (error) return { error: `ลบไม่สำเร็จ: ${error.message}` };

  if (existing?.file_url) {
    await deleteDocumentFileByUrl(supabase, existing.file_url);
  }

  revalidatePath(revalidateTarget);
}
