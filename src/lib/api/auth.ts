import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database.types";
import { fail } from "@/lib/api/respond";

type AuthResult =
  | { user: { id: string; email?: string }; supabase: SupabaseClient<Database> }
  | { response: NextResponse };

/**
 * Every API route under src/app/api/** requires `Authorization: Bearer
 * <access_token>` — no cookie fallback, so the app's own frontend and an
 * external client like Postman authenticate identically (see the refactor
 * plan). The returned `supabase` client carries that same token, so
 * Postgres RLS still enforces per-user ownership exactly as it does for
 * today's Server Actions — this function only checks that the token is
 * valid, it never widens what the caller can do.
 */
export async function authenticateRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return { response: fail("Unauthorized: missing Authorization: Bearer <token> header", 401) };
  }

  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { response: fail("Unauthorized: invalid or expired token", 401) };
  }

  return { user, supabase };
}
