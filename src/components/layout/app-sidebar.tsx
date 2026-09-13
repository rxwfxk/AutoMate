"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Bike, Gauge, Home, UserRound } from "lucide-react";

import { cn } from "cn";
import { getDisplayName, getInitials } from "@/lib/user-display";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  onNavigate,
}: {
  user: User | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-4">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Gauge className="size-4" />
        </div>
        <span className="font-heading text-sm font-semibold tracking-tight">
          Vehicle Maintenance Log
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-border p-4">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{getDisplayName(user)}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <div className="p-4 pt-0">
        <SignOutButton className="w-full" />
      </div>
    </div>
  );
}
