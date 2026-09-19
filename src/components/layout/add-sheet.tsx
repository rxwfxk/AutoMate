"use client";

import { useRouter } from "next/navigation";
import { Bike, FileText, Gauge, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const OPTIONS: {
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  href: string;
}[] = [
  {
    label: "บันทึกซ่อมบำรุง",
    description: "เปลี่ยนถ่าย ตรวจเช็ก ซ่อม",
    icon: Wrench,
    iconBg: "bg-cta-soft",
    iconColor: "text-cta",
    href: "/vehicles",
  },
  {
    label: "เอกสารของรถ",
    description: "พ.ร.บ. · ประกัน · ภาษี",
    icon: FileText,
    iconBg: "bg-flag-due-soon-soft",
    iconColor: "text-flag-due-soon-soft-foreground",
    href: "/vehicles",
  },
  {
    label: "รถคันใหม่",
    description: "ชื่อ ยี่ห้อ รุ่น ทะเบียน เลขไมล์",
    icon: Bike,
    iconBg: "bg-flag-ok-soft",
    iconColor: "text-flag-ok-soft-foreground",
    href: "/vehicles/new",
  },
  {
    label: "อัปเดตเลขไมล์",
    description: "ให้ธงเตือนแม่นขึ้น",
    icon: Gauge,
    iconBg: "bg-line",
    iconColor: "text-ink-muted",
    href: "/vehicles",
  },
];

export function AddSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();

  function handleSelect(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="flex flex-col gap-4 rounded-t-[34px] border-0 bg-surface p-5.5 shadow-sheet"
      >
        <SheetTitle className="sr-only">เพิ่มอะไรดี</SheetTitle>
        <div className="mx-auto h-1.25 w-13 rounded-full bg-line-strong" />
        <h2 className="text-[22px] font-extrabold text-ink">เพิ่มอะไรดี</h2>

        <div className="flex flex-col gap-2.5">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => handleSelect(option.href)}
                className="flex items-center gap-3.5 rounded-list bg-surface-card p-4 text-left"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-icon ${option.iconBg} ${option.iconColor}`}
                >
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-extrabold text-ink">{option.label}</p>
                  <p className="truncate text-[13px] text-ink-3">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-button border border-line-strong p-4 text-sm font-extrabold text-ink"
        >
          ปิด
        </button>
      </SheetContent>
    </Sheet>
  );
}
