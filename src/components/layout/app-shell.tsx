"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { cn } from "cn";
import { apiFetch } from "@/lib/api-client";
import { getDateFlagStatus } from "@/lib/flag-status";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import type { Document } from "@/types/database.types";

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

export function AppShell({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  // One fetch shared by the sidebar and the bottom nav (both are always mounted,
  // one hidden by CSS) instead of each asking /api/documents for the same dot.
  const [hasDocumentAlert, setHasDocumentAlert] = useState(false);

  useEffect(() => {
    apiFetch<Document[]>("/api/documents").then((result) => {
      if (!result.error) {
        setHasDocumentAlert(result.data!.some((d) => getDateFlagStatus(d.expiry_date) !== "green"));
      }
    });
  }, []);

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
    <div className="flex min-h-dvh flex-1">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-ink-line transition-[width] duration-150 lg:flex lg:flex-col",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <AppSidebar
          user={user}
          collapsed={collapsed}
          hasDocumentAlert={hasDocumentAlert}
          onToggleCollapsed={toggleCollapsed}
        />
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Bottom tab bar replaces the mobile drawer — see mobile-bottom-nav.tsx.
            pb-20 keeps page content clear of the fixed bar. */}
        <main className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</main>
        <MobileBottomNav hasDocumentAlert={hasDocumentAlert} />
      </div>
    </div>
  );
}
