"use client";

import * as React from "react";
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { cn } from "cn";

export interface ImpactRow {
  label: string;
  value: React.ReactNode;
}

/** ฿ amount for an ImpactRow — the symbol must stay out of font-mono (no proper glyph, collides with digits). */
export function bahtValue(amount: number): React.ReactNode {
  return (
    <>
      <span className="font-sans">฿ </span>
      {amount.toLocaleString("th-TH")}
    </>
  );
}

interface ConfirmDeleteDialogProps {
  triggerAriaLabel: string;
  /** Replaces the default small icon-button styling (cn here doesn't de-conflict Tailwind classes). */
  triggerClassName?: string;
  title: string;
  description?: string;
  /** `undefined` while still loading, `null`/`[]` to skip the box entirely. */
  impactRows?: ImpactRow[] | null;
  impactLoading?: boolean;
  /** README's 4b: for maintenance-log deletion, warn what happens to the
   * flag — shown mobile-only per spec. */
  flagWarning?: string;
  /** README's 4b "ทางออก" line — desktop-only per spec. */
  exitNote?: string;
  confirmLabel: string;
  /** Fires when the dialog transitions to open — e.g. to lazy-fetch fresh
   * impact numbers instead of trusting whatever the caller already has in
   * memory (see delete-vehicle-dialog.tsx). */
  onOpen?: () => void;
  onConfirm: () => Promise<{ error: string | null }>;
  onDeleted?: () => void;
}

/**
 * Single responsive implementation of README's 4b — a centered modal at
 * `lg:` and up, a bottom sheet below it — rather than two separate
 * components, since (unlike the desktop-layout steps) there's no existing
 * redesigned dialog to preserve here; this replaces the old `AlertDialog`
 * everywhere it was used.
 */
export function ConfirmDeleteDialog({
  triggerAriaLabel,
  triggerClassName,
  title,
  description,
  impactRows,
  impactLoading,
  flagWarning,
  exitNote,
  confirmLabel,
  onOpen,
  onConfirm,
  onDeleted,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (isDeleting) return; // spec: delete button disabled + "กำลังลบ..." while in flight, not dismissible
    setOpen(next);
    if (next) onOpen?.();
    else setError(null);
  }

  async function handleConfirm() {
    setIsDeleting(true);
    setError(null);
    const result = await onConfirm();
    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }
    setIsDeleting(false);
    setOpen(false);
    onDeleted?.();
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        aria-label={triggerAriaLabel}
        className={
          triggerClassName ??
          "flex size-8 items-center justify-center rounded-icon text-ink-muted hover:bg-base"
        }
      >
        <Trash2 className="size-4 text-flag-overdue" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(36,26,20,0.55)] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col gap-4 overflow-y-auto rounded-t-[34px] bg-surface p-5.5 shadow-sheet transition duration-150 ease-out data-ending-style:translate-y-8 data-ending-style:opacity-0 data-starting-style:translate-y-8 data-starting-style:opacity-0",
            "lg:top-1/2 lg:right-auto lg:bottom-auto lg:left-1/2 lg:w-[452px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[28px] lg:p-6.5 lg:shadow-[0_24px_48px_-16px_rgba(36,26,20,0.5)] lg:data-ending-style:translate-x-[-50%] lg:data-ending-style:translate-y-[calc(-50%+8px)] lg:data-starting-style:translate-x-[-50%] lg:data-starting-style:translate-y-[calc(-50%+8px)]",
          )}
        >
          <div className="mx-auto h-1.25 w-13 shrink-0 rounded-full bg-line-strong lg:hidden" />

          <div className="flex size-11.5 shrink-0 items-center justify-center rounded-icon bg-cta-soft text-flag-overdue">
            <AlertTriangle className="size-5.5" />
          </div>

          <div>
            <Dialog.Title className="text-xl leading-tight font-extrabold text-ink lg:text-[22px]">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="mt-1.5 text-[15px] text-ink-2">{description}</Dialog.Description>
            )}
          </div>

          {(impactLoading || (impactRows && impactRows.length > 0) || flagWarning) && (
            <div className="flex flex-col gap-2.25 rounded-list bg-base p-4">
              {impactLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="size-4 animate-spin text-ink-muted" />
                </div>
              ) : (
                impactRows?.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-ink-2">{row.label}</span>
                    <span className="font-mono text-sm text-ink">{row.value}</span>
                  </div>
                ))
              )}
              {!impactLoading && flagWarning && (
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 lg:hidden",
                    impactRows && impactRows.length > 0 && "border-t border-line pt-2.25",
                  )}
                >
                  <span className="text-sm font-bold text-ink-2">ผลต่อธง</span>
                  <span className="text-right text-sm font-bold text-flag-overdue">{flagWarning}</span>
                </div>
              )}
            </div>
          )}

          {exitNote && <p className="hidden text-[13px] text-ink-muted lg:block">{exitNote}</p>}

          {error && <p className="text-sm font-bold text-flag-overdue">{error}</p>}

          <div className="flex flex-col gap-2.5 lg:flex-row">
            <Dialog.Close
              disabled={isDeleting}
              className="rounded-button border-[1.5px] border-line-strong p-4 text-[15px] font-extrabold text-ink disabled:opacity-50 lg:flex-[1.4]"
            >
              ยกเลิก
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex items-center justify-center gap-1.5 rounded-button bg-flag-overdue p-4 text-[15px] font-extrabold text-surface disabled:opacity-70 lg:flex-1"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              {isDeleting ? "กำลังลบ..." : confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
