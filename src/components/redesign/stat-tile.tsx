import * as React from "react";
import { cn } from "cn";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  /** "alert" = the cta-soft/flag-overdue treatment used for the "ต้องทำ" tile */
  tone?: "default" | "alert";
  className?: string;
}

/** Dashboard stat tile — grid item per README's Dashboard screen spec. */
function StatTile({ label, value, sublabel, tone = "default", className }: StatTileProps) {
  return (
    <div
      data-slot="rd-stat-tile"
      className={cn(
        "min-w-0 rounded-list border px-3 py-3.5",
        tone === "alert" ? "border-cta-soft-line bg-cta-soft" : "border-line bg-surface-card",
        className,
      )}
    >
      <p className={cn("text-xs font-bold", tone === "alert" ? "text-cta-ink" : "text-ink-3")}>
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate font-mono text-xl font-medium sm:text-2xl lg:text-[32px]",
          tone === "alert" ? "text-flag-overdue" : "text-ink",
        )}
      >
        {value}
      </p>
      {sublabel ? <p className="mt-0.5 text-xs text-ink-muted">{sublabel}</p> : null}
    </div>
  );
}

export { StatTile };
export type { StatTileProps };
