import * as React from "react";
import { cn } from "cn";

/** Flex "table row" for desktop data tables — README's "ไม่ใช้ <table> ใช้ flex
 * row" rule. Pair with DataCell: fixed-width columns get `width` (+
 * flex-shrink:0 baked in), the stretchy column gets `flex` (flex:1 +
 * min-width:0, so long text doesn't force the row to overflow). */
function DataRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-slot="rd-data-row"
      className={cn(
        "flex items-center gap-3 rounded-list border border-line bg-surface-card px-4 py-3.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function DataCell({
  width,
  flex,
  className,
  children,
}: {
  width?: number;
  flex?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="rd-data-cell"
      className={cn("overflow-hidden", flex ? "min-w-0 flex-1" : "shrink-0", className)}
      style={width ? { width } : undefined}
    >
      {children}
    </div>
  );
}

export { DataRow, DataCell };
