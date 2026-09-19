import * as React from "react";
import { cn } from "cn";

interface ChipProps extends Omit<React.ComponentProps<"button">, "type"> {
  selected?: boolean;
}

/** Pill-shaped filter/quick-select button — used for vehicle/document filter
 * chips, quick maintenance-type select, notice-lead-time chips, and the
 * monthly/yearly chart toggle. */
function Chip({ selected = false, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      data-slot="rd-chip"
      aria-pressed={selected}
      className={cn(
        "rounded-full px-3.5 py-2 text-[13px] whitespace-nowrap transition-colors duration-150 ease-out",
        selected
          ? "border-[1.5px] border-cta bg-cta-soft font-extrabold text-cta-ink"
          : "border border-line-strong font-bold text-ink-3",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { Chip };
export type { ChipProps };
