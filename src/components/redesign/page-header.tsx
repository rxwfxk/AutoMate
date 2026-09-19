import * as React from "react";
import { cn } from "cn";

interface PageHeaderProps {
  /** Top line above the title — a plain summary ("2 คัน · ต้องดำเนินการ 3 รายการ")
   * or a <Breadcrumb />. */
  eyebrow?: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Desktop page header pattern (breadcrumb/summary + title + action buttons),
 * reused across every desktop screen per the handoff's "Pattern ที่ใช้ซ้ำทุกหน้า". */
function PageHeader({ eyebrow, title, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow}
        <h1 className="mt-1 truncate text-[30px] font-extrabold text-ink">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/** "รถของฉัน › เจ้าเวฟแดง" style trail — last item styled as the current page. */
function Breadcrumb({ items }: { items: string[] }) {
  return (
    <p className="text-sm font-bold text-ink-muted">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="mx-1.5">›</span>}
          <span className={i === items.length - 1 ? "text-ink" : undefined}>{item}</span>
        </React.Fragment>
      ))}
    </p>
  );
}

export { PageHeader, Breadcrumb };
export type { PageHeaderProps };
