import type { User } from "@supabase/supabase-js";

/** Full name from Auth user_metadata (set at signup / edited on /profile),
 * falling back to email, then a generic label — never blank. */
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return "ผู้ใช้";

  const firstName = (user.user_metadata?.first_name as string | undefined)?.trim();
  const lastName = (user.user_metadata?.last_name as string | undefined)?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return fullName || user.email || "ผู้ใช้";
}

export function getInitials(user: User | null | undefined): string {
  const name = getDisplayName(user);
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
