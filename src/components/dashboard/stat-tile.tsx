import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export function StatTile({
  icon: Icon,
  label,
  value,
  unit,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card py-4 pr-4 pl-5">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          tone === "warning" && "bg-flag-yellow",
          tone === "danger" && "bg-flag-red",
          tone === "default" && "bg-flag-green",
        )}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
          {value}
          {unit && <span className="ml-1.5 text-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
      </div>

      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          tone === "warning" && "bg-flag-yellow/10 text-flag-yellow",
          tone === "danger" && "bg-flag-red/10 text-flag-red",
          tone === "default" && "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-5" />
      </div>
    </div>
  );
}
