import * as React from "react";
import { cn } from "cn";

type CardTone = "surface" | "dark";
type CardSize = "main" | "list";

interface CardProps extends React.ComponentProps<"div"> {
  tone?: CardTone;
  size?: CardSize;
}

/**
 * Warm-redesign card primitive. "main" = shadow-card, no border (page
 * sections, CTA cards); "list" = 1px border, no shadow (list rows) — per
 * design_handoff_automate_redesign/README.md's shadow rules.
 */
function Card({ className, tone = "surface", size = "main", ...props }: CardProps) {
  return (
    <div
      data-slot="rd-card"
      className={cn(
        size === "main" ? "rounded-card p-5" : "rounded-list p-3.5",
        tone === "dark"
          ? "bg-ink text-surface"
          : size === "main"
            ? "bg-surface-card shadow-card"
            : "bg-surface-card border border-line",
        className,
      )}
      {...props}
    />
  );
}

export { Card };
export type { CardProps, CardTone, CardSize };
