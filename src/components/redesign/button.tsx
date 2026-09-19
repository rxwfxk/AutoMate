import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

// Native <button> (not base-ui's Button) so it composes with Link the same
// way the rest of the app does: export buttonVariants and apply it as a
// className on <Link>, per the pattern already used in vehicle-card.tsx.
const buttonVariants = cva(
  "inline-flex min-h-13 items-center justify-center gap-2 rounded-button px-5 text-base font-extrabold whitespace-nowrap select-none transition-[background-color,border-color,transform] duration-150 ease-out active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        cta: "bg-cta text-surface hover:bg-cta-hover",
        dark: "bg-ink text-surface hover:bg-ink-2",
        outline: "border border-line-strong bg-surface text-ink hover:bg-stripe-light",
      },
    },
    defaultVariants: {
      variant: "cta",
    },
  },
);

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {}

function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button
      data-slot="rd-button"
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
