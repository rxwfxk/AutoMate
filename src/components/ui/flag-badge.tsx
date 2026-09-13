import { cn } from "cn";
import { FLAG_LABEL, type FlagStatus } from "@/lib/flag-status";

const FLAG_CLASSES: Record<FlagStatus, string> = {
  green: "bg-flag-green/10 text-flag-green",
  yellow: "bg-flag-yellow/10 text-flag-yellow",
  red: "bg-flag-red/10 text-flag-red",
};

const FLAG_DOT_CLASSES: Record<FlagStatus, string> = {
  green: "bg-flag-green",
  yellow: "bg-flag-yellow",
  red: "bg-flag-red",
};

export function FlagBadge({ status, className }: { status: FlagStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        FLAG_CLASSES[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", FLAG_DOT_CLASSES[status])} />
      {FLAG_LABEL[status]}
    </span>
  );
}
