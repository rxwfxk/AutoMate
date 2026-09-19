"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, FileText, Home, Plus, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";
import { AddSheet } from "@/components/layout/add-sheet";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "แดชบอร์ด", icon: Home },
  { href: "/vehicles", label: "รถของฉัน", icon: Bike },
  { href: "/documents", label: "เอกสาร", icon: FileText },
  { href: "/profile", label: "โปรไฟล์", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavIcon({ icon: Icon, active, alert }: { icon: LucideIcon; active: boolean; alert?: boolean }) {
  return (
    <span className="relative">
      <Icon className={active ? "size-6 text-cta" : "size-6 text-ink-muted"} />
      {alert && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-flag-due-soon" />}
    </span>
  );
}

export function MobileBottomNav({ hasDocumentAlert = false }: { hasDocumentAlert?: boolean }) {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);
  const [dashboard, vehicles, documents, profile] = NAV_ITEMS;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-0.5 border-t border-line bg-surface px-2.5 pt-3 pb-5.5 md:hidden">
        <Tab item={dashboard} active={isActive(pathname, dashboard.href)} />
        <Tab item={vehicles} active={isActive(pathname, vehicles.href)} />

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
        >
          <Plus className="size-6 text-ink-muted" />
          <span className="text-[11px] font-bold whitespace-nowrap text-ink-muted">เพิ่มบันทึก</span>
        </button>

        <Tab item={documents} active={isActive(pathname, documents.href)} alert={hasDocumentAlert} />
        <Tab item={profile} active={isActive(pathname, profile.href)} />
      </nav>

      <AddSheet open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

function Tab({
  item,
  active,
  alert,
}: {
  item: { href: string; label: string; icon: LucideIcon };
  active: boolean;
  alert?: boolean;
}) {
  return (
    <Link href={item.href} className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <NavIcon icon={item.icon} active={active} alert={alert} />
      <span
        className={cn(
          "text-[11px] whitespace-nowrap",
          active ? "font-extrabold text-cta" : "font-bold text-ink-muted",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}
