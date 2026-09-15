"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Gauge, Menu } from "lucide-react";

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/layout/app-sidebar";

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

export function AppShell({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever navigation actually happens.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Read the saved preference after mount so the server-rendered markup
  // (always "expanded") matches the first client render — avoids a
  // hydration mismatch — then the sidebar snaps to the saved state.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true");
    } catch {
      // Private browsing / blocked storage — default to expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Ignore — per-viewer convenience only, not load-bearing.
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-border transition-[width] duration-150 md:flex md:flex-col",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <AppSidebar user={user} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
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
              <AppSidebar
                user={user}
                onNavigate={() => setMobileNavOpen(false)}
                insideMobileDrawer
              />
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
