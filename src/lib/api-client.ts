import { createClient } from "@/lib/supabase/client";

// Not a discriminated union on purpose — `error?: undefined` vs `error: string`
// isn't a literal-typed discriminant, so `if (result.error)` wouldn't reliably
// narrow `result.data` at call sites. Both fields are always present instead;
// callers check `error` first and can safely assume `data` is set otherwise.
type ApiResult<T> = { data: T | null; error: string | null };

/**
 * Calls one of our own /api/** routes with the current session's access
 * token attached as `Authorization: Bearer` — the same header an external
 * client (Postman, a future mobile app) would use. Reads the session fresh
 * on every call rather than caching the token, since the Supabase SDK
 * refreshes it automatically in the background.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { data: null, error: "กรุณาเข้าสู่ระบบ" };
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...init.headers,
      },
    });
  } catch {
    return { data: null, error: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่" };
  }

  let body: { error?: boolean; data?: T; msg?: string };
  try {
    body = await response.json();
  } catch {
    return { data: null, error: `เซิร์ฟเวอร์ตอบกลับผิดปกติ (${response.status})` };
  }

  if (!response.ok || body.error) {
    return { data: null, error: body.msg ?? `เกิดข้อผิดพลาด (${response.status})` };
  }

  return { data: body.data as T, error: null };
}
