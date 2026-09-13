import { Gauge } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gauge className="size-6" />
          </div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Vehicle Maintenance Log
          </h1>
          <p className="text-sm text-muted-foreground">
            บันทึกและติดตามการดูแลรักษามอเตอร์ไซค์ของคุณ
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
