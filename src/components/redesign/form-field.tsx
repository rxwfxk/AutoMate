import * as React from "react";
import { cn } from "cn";

interface FormFieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Label + input slot + hint/error line. Wrap an input styled with fieldInputClassName(). */
function FormField({ label, htmlFor, hint, error, required, className, children }: FormFieldProps) {
  return (
    <div data-slot="rd-form-field" className={cn("flex flex-col", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 text-sm font-bold text-ink-3">
        {label}
        {required ? <span className="text-flag-overdue"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-bold text-flag-overdue">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Class string for the actual <input>/<select>/<textarea> inside a
 * FormField. `emphasized` = the featured-field style (e.g. the maintenance
 * type selector): thicker ink border, larger padding/text.
 */
function fieldInputClassName(opts?: { emphasized?: boolean; invalid?: boolean }) {
  return cn(
    "w-full rounded-list bg-surface-card text-ink outline-none placeholder:text-ink-faint transition-colors duration-150 ease-out",
    opts?.emphasized ? "border-[1.5px] border-ink p-4 text-[17px] font-bold" : "border border-line-strong p-3.75",
    opts?.invalid && "border-flag-overdue",
  );
}

export { FormField, fieldInputClassName };
export type { FormFieldProps };
