import * as React from "react";
import { cn } from "cn";
import { FLAG_LABEL, type FlagStatus } from "@/lib/flag-status";

const DOT_COLOR: Record<FlagStatus, string> = {
  red: "bg-flag-overdue",
  yellow: "bg-flag-due-soon",
  green: "bg-flag-ok",
};

/** Small filled status dot — e.g. the corner dot on a vehicle thumbnail. */
function StatusDot({ status, className }: { status: FlagStatus; className?: string }) {
  return (
    <span
      data-slot="rd-status-dot"
      aria-hidden
      className={cn("inline-block size-2.5 rounded-full", DOT_COLOR[status], className)}
    />
  );
}

// "soft" = light/cream backgrounds (soft tint + ink text). "solid" = dark
// card backgrounds (saturated fill) — matches the on-dark badge cases in
// the handoff (vehicle info card, driving license card).
const BADGE_SOFT: Record<FlagStatus, string> = {
  red: "bg-flag-overdue-soft text-flag-overdue-soft-foreground",
  yellow: "bg-flag-due-soon-soft text-flag-due-soon-soft-foreground",
  green: "bg-flag-ok-soft text-flag-ok-soft-foreground",
};

const BADGE_SOLID: Record<FlagStatus, string> = {
  red: "bg-flag-overdue text-surface",
  yellow: "bg-flag-due-soon text-ink",
  green: "bg-flag-ok-on-dark text-flag-ok-on-dark-foreground",
};

interface StatusBadgeProps {
  status: FlagStatus;
  tone?: "soft" | "solid";
  children?: React.ReactNode;
  className?: string;
}

function StatusBadge({ status, tone = "soft", children, className }: StatusBadgeProps) {
  return (
    <span
      data-slot="rd-status-badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        tone === "soft" ? BADGE_SOFT[status] : BADGE_SOLID[status],
        className,
      )}
    >
      {children ?? FLAG_LABEL[status]}
    </span>
  );
}

export { StatusDot, StatusBadge };
export type { StatusBadgeProps };
