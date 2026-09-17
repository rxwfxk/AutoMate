import { authenticateRequest } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";

/** GET /api/maintenance-types — global lookup, readable by any signed-in user. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;

  const { data, error } = await supabase.from("maintenance_types").select("*").order("name");
  if (error) return fail(error.message, 500);
  return ok(data);
}
