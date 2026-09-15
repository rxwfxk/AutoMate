"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import type { User } from "@supabase/supabase-js";
import { Bike, Gauge, Home, Moon, PanelLeftClose, PanelLeftOpen, Sun, UserRound } from "lucide-react";

import { cn } from "cn";
import { getAvatarUrl, getDisplayName, getInitials } from "@/lib/user-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

const NAV_ITEMS = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/vehicles", label: "รถของฉัน", icon: Bike },
  { href: "/profile", label: "โปรไฟล์", icon: UserRound },
] as const;

function isNavItemActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppSidebar({
  user,
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
}: {
  user: User | null;
  /** Only meaningful on the desktop rail — the mobile drawer is always expanded. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  // theme is undefined until next-themes reads localStorage on mount — default
  // the icon to "dark" (the app default) until then, same reasoning as the
  // sidebar-collapsed localStorage read, to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = mounted && theme === "light";

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center gap-2 p-4",
          collapsed && "flex-col justify-center gap-3 px-2",
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Gauge className="size-4" />
        </div>
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate font-heading text-sm font-semibold tracking-tight">
            Vehicle Maintenance Log
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(isLight ? "dark" : "light")}
          aria-label={isLight ? "สลับเป็นธีมมืด" : "สลับเป็นธีมสว่าง"}
        >
          {isLight ? <Sun /> : <Moon />}
        </Button>
        {onToggleCollapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "ขยาย sidebar" : "ยุบ sidebar"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        )}
      </div>

      <nav className={cn("flex flex-1 flex-col gap-1 p-2", collapsed && "items-center")}>
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "w-9 justify-center px-0",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "flex items-center gap-2.5 border-t border-border p-4",
          collapsed && "justify-center px-2",
        )}
      >
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={getAvatarUrl(user)} alt="" />
          <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{getDisplayName(user)}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        )}
      </div>

      <div className={cn("p-4 pt-0", collapsed && "flex justify-center px-2")}>
        <SignOutButton className={collapsed ? undefined : "w-full"} iconOnly={collapsed} />
      </div>
    </div>
  );
}
