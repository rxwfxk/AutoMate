"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Gauge, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/layout/app-sidebar";

export function AppShell({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever navigation actually happens.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-64 shrink-0 border-r border-border md:flex md:flex-col">
        <AppSidebar user={user} />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border p-3 md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="เปิดเมนู"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu />
            </Button>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
              <AppSidebar user={user} onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Gauge className="size-3.5" />
            </div>
            <span className="font-heading text-sm font-semibold tracking-tight">
              Vehicle Maintenance Log
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
