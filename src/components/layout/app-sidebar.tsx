"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Bike, FileText, Gauge, Home, Loader2, LogOut, Menu, UserRound } from "lucide-react";

import { cn } from "cn";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";
import { getAvatarUrl, getDisplayName, getInitials } from "@/lib/user-display";
import { VEHICLES_CHANGED_EVENT } from "@/components/vehicles/delete-vehicle-dialog";
import type { Vehicle } from "@/types/database.types";

const NAV_ITEMS = [
  { href: "/", label: "แดชบอร์ด", icon: Home },
  { href: "/vehicles", label: "รถของฉัน", icon: Bike },
  { href: "/documents", label: "เอกสาร", icon: FileText },
  { href: "/profile", label: "โปรไฟล์", icon: UserRound },
] as const;

function isNavItemActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppSidebar({
  user,
  collapsed = false,
  hasDocumentAlert = false,
  onToggleCollapsed,
}: {
  user: User | null;
  collapsed?: boolean;
  hasDocumentAlert?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);

  // Refetch on navigation (covers adding a vehicle, which lands on /vehicles)
  // and when a vehicle is deleted in place (delete dialog fires the event).
  useEffect(() => {
    const load = () =>
      apiFetch<Vehicle[]>("/api/vehicles").then((result) => {
        if (!result.error) setVehicleCount(result.data!.length);
      });
    load();
    window.addEventListener(VEHICLES_CHANGED_EVENT, load);
    return () => window.removeEventListener(VEHICLES_CHANGED_EVENT, load);
  }, [pathname]);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col gap-5.5 bg-ink p-4">
      <div className={cn("flex items-center gap-2", collapsed && "flex-col justify-center gap-3")}>
        {collapsed && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="ขยาย sidebar"
            className="flex size-7 shrink-0 items-center justify-center rounded-icon border-[1.5px] border-ink-line text-ink-faint"
          >
            <Menu className="size-3.5" />
          </button>
        )}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-icon bg-cta text-surface">
          <Gauge className="size-4" />
        </div>
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-lg font-extrabold text-surface">AutoMate</span>
        )}
        {!collapsed && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="ยุบ sidebar"
            className="flex size-7 shrink-0 items-center justify-center rounded-icon border-[1.5px] border-ink-line text-ink-faint"
          >
            <Menu className="size-3.5" />
          </button>
        )}
      </div>

      <nav className={cn("flex flex-1 flex-col gap-1.5", collapsed && "items-center")}>
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-list px-3.5 py-3 text-[15px] transition-colors duration-150 ease-out",
                collapsed && "w-9 justify-center px-0",
                active ? "bg-surface font-extrabold text-ink" : "text-line-dash font-bold",
              )}
            >
              {active ? (
                <Icon className="size-5 shrink-0 text-cta" />
              ) : (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-[7px] border-2 border-[#6b5748]">
                  <Icon className="size-3" />
                </span>
              )}
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.href === "/vehicles" && vehicleCount !== null && (
                    <span
                      className={cn(
                        "shrink-0 font-mono text-xs",
                        active ? "text-ink-muted" : "text-ink-faint",
                      )}
                    >
                      {vehicleCount}
                    </span>
                  )}
                  {item.href === "/documents" && hasDocumentAlert && (
                    <span className="size-2 shrink-0 rounded-full bg-flag-due-soon" />
                  )}
                </>
              )}
              {collapsed && item.href === "/documents" && hasDocumentAlert && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-flag-due-soon" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("mt-auto flex flex-col gap-3.5 border-t border-ink-line pt-4", collapsed && "items-center")}>
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-icon bg-ink-deep-3 text-xs font-extrabold text-surface">
            {getAvatarUrl(user) ? (
              <Image src={getAvatarUrl(user)!} alt="" fill sizes="36px" className="object-cover" />
            ) : (
              getInitials(user)
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-surface">{getDisplayName(user)}</p>
              <p className="truncate text-xs text-ink-faint">{user?.email}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="ออกจากระบบ"
          className="flex items-center justify-center gap-1.5 rounded-icon border-[1.5px] border-ink-line p-2.5 text-sm font-bold text-surface disabled:opacity-50"
        >
          {isSigningOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          {!collapsed && "ออกจากระบบ"}
        </button>
      </div>
    </div>
  );
}
