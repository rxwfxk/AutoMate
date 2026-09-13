import Link from "next/link";
import { Gauge } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gauge className="size-4" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-tight sm:text-base">
            Vehicle Maintenance Log
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/vehicles"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            รถของฉัน
          </Link>
          <span className="hidden font-mono text-sm text-muted-foreground sm:inline">
            {user?.email}
          </span>
          <SignOutButton />
        </nav>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
