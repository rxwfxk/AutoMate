"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2, LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/**
 * Sign-out button that asks first. Owns the sign-out itself so every entry
 * point (sidebar, mobile profile page) confirms the same way. Same responsive
 * shell as ConfirmDeleteDialog — bottom sheet below `lg:`, centered modal above.
 */
export function SignOutDialog({
  children,
  triggerClassName,
  triggerAriaLabel = "ออกจากระบบ",
}: {
  children: React.ReactNode;
  triggerClassName: string;
  triggerAriaLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleConfirm() {
    setIsSigningOut(true);
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !isSigningOut && setOpen(next)}>
      <Dialog.Trigger aria-label={triggerAriaLabel} className={triggerClassName}>
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(36,26,20,0.55)] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col gap-4 overflow-y-auto rounded-t-[34px] bg-surface p-5.5 shadow-sheet transition duration-150 ease-out data-ending-style:translate-y-8 data-ending-style:opacity-0 data-starting-style:translate-y-8 data-starting-style:opacity-0 lg:top-1/2 lg:right-auto lg:bottom-auto lg:left-1/2 lg:w-[400px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[28px] lg:p-6.5 lg:shadow-[0_24px_48px_-16px_rgba(36,26,20,0.5)] lg:data-ending-style:translate-x-[-50%] lg:data-ending-style:translate-y-[calc(-50%+8px)] lg:data-starting-style:translate-x-[-50%] lg:data-starting-style:translate-y-[calc(-50%+8px)]">
          <div className="mx-auto h-1.25 w-13 shrink-0 rounded-full bg-line-strong lg:hidden" />

          <div className="flex size-11.5 shrink-0 items-center justify-center rounded-icon bg-cta-soft text-cta">
            <LogOut className="size-5.5" />
          </div>

          <div>
            <Dialog.Title className="text-xl leading-tight font-extrabold text-ink lg:text-[22px]">
              ออกจากระบบ?
            </Dialog.Title>
            <Dialog.Description className="mt-1.5 text-[15px] text-ink-2">
              คุณต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งานต่อ
            </Dialog.Description>
          </div>

          <div className="flex flex-col gap-2.5 lg:flex-row">
            <Dialog.Close
              disabled={isSigningOut}
              className="rounded-button border-[1.5px] border-line-strong p-4 text-[15px] font-extrabold text-ink disabled:opacity-50 lg:flex-1"
            >
              ยกเลิก
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSigningOut}
              className="flex items-center justify-center gap-1.5 rounded-button bg-ink p-4 text-[15px] font-extrabold text-surface disabled:opacity-70 lg:flex-1"
            >
              {isSigningOut && <Loader2 className="size-4 animate-spin" />}
              {isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
