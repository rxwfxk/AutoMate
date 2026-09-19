import * as React from "react";
import { cn } from "cn";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

/** 48×28 switch — currently only used by the notification-settings page (3e). */
function Toggle({ checked, onChange, disabled, className, ...props }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-slot="rd-toggle"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-55",
        checked ? "bg-cta" : "bg-line-strong",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.75 size-5.5 rounded-full bg-surface transition-[left] duration-150 ease-out",
          checked ? "left-5.75" : "left-0.75",
        )}
      />
    </button>
  );
}

export { Toggle };
export type { ToggleProps };
