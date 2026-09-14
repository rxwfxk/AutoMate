import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}
