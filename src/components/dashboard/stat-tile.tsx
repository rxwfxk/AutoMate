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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          tone === "warning" && "bg-flag-yellow/10 text-flag-yellow",
          tone === "danger" && "bg-flag-red/10 text-flag-red",
          tone === "default" && "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-xl font-semibold leading-tight">
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
