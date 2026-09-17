import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed `middleware.ts` → `proxy.ts` and `middleware` → `proxy`
// (see CLAUDE.md). This file must live next to `app/`, i.e. inside `src/`.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, Next's own image optimizer,
     * and /api/** — API routes authenticate themselves via a Bearer token
     * (see src/lib/api/auth.ts) and must return a JSON 401, not this
     * redirect-to-/login page behavior, when the caller isn't signed in.
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
