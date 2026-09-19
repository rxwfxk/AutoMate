import { authenticateRequest } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";

/** GET /api/documents — every vehicle-scoped document (พ.ร.บ./ประกัน/ภาษี)
 * the caller owns, across all their vehicles, with the vehicle name joined
 * in so the all-vehicles /documents page doesn't need a second round trip.
 * Excludes the driving license on purpose — that row has `vehicle_id: null`
 * (see migration 0005's XOR), it belongs on /profile, not here. RLS already
 * scopes both ownership paths; this filter is just about scope, not access. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("documents")
    .select("*, vehicles(id, name)")
    .not("vehicle_id", "is", null)
    .order("expiry_date", { ascending: true });

  if (error) return fail(error.message, 500);
  return ok(data ?? []);
}
