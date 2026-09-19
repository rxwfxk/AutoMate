"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { cn } from "cn";
import { apiFetch } from "@/lib/api-client";
import { DOCUMENTS_CHANGED_EVENT } from "@/components/documents/delete-document-dialog";
import { currentDocuments } from "@/lib/current-items";
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
  // README's tablet spec (768–1023px): the sidebar rests as the icon rail and the
  // content stays single-column. The toggle still works there, but expanding
  // slides the full sidebar over the content (tabletOpen) instead of squeezing
  // it. Needs JS because the sidebar renders its labels conditionally; starts
  // false so SSR and first client render match.
  const [isTablet, setIsTablet] = useState(false);
  const [tabletOpen, setTabletOpen] = useState(false);
  const pathname = usePathname();
  // One fetch shared by the sidebar and the bottom nav (both are always mounted,
  // one hidden by CSS) instead of each asking /api/documents for the same dot.
  const [hasDocumentAlert, setHasDocumentAlert] = useState(false);

  // Refetch on navigation (a save/redirect may have changed a document) and when a
  // document is deleted in place (no navigation happens then).
  useEffect(() => {
    function load() {
      apiFetch<Document[]>("/api/documents").then((result) => {
        if (!result.error) {
          setHasDocumentAlert(currentDocuments(result.data!).some((d) => getDateFlagStatus(d.expiry_date) !== "green"));
        }
      });
    }
    load();
    window.addEventListener(DOCUMENTS_CHANGED_EVENT, load);
    return () => window.removeEventListener(DOCUMENTS_CHANGED_EVENT, load);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023.98px)");
    const update = () => setIsTablet(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Close the overlay after navigating, or when leaving the tablet range.
  useEffect(() => {
    setTabletOpen(false);
  }, [pathname, isTablet]);

  const overlay = isTablet && tabletOpen;
  const railOnly = isTablet ? !tabletOpen : collapsed;

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
          "sticky top-0 hidden h-screen shrink-0 border-r border-ink-line transition-[width] duration-150 md:flex md:flex-col",
          isTablet || collapsed ? "w-16" : "w-64",
        )}
      >
        {overlay && (
          <div
            aria-hidden
            onClick={() => setTabletOpen(false)}
            className="fixed inset-0 z-40 bg-[rgba(36,26,20,0.45)]"
          />
        )}
        <div className={cn(overlay ? "fixed inset-y-0 left-0 z-50 w-64 shadow-sheet" : "h-full")}>
          <AppSidebar
            user={user}
            collapsed={railOnly}
            hasDocumentAlert={hasDocumentAlert}
            onToggleCollapsed={isTablet ? () => setTabletOpen((open) => !open) : toggleCollapsed}
          />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Bottom tab bar replaces the mobile drawer — see mobile-bottom-nav.tsx.
            pb-20 keeps page content clear of the fixed bar. */}
        <main className="flex flex-1 flex-col pb-20 md:pb-0">{children}</main>
        <MobileBottomNav hasDocumentAlert={hasDocumentAlert} />
      </div>
    </div>
  );
}
