import Link from "next/link";
import { Bike, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// Temporary landing placeholder — gets replaced by the real Dashboard in
// Step 7. For now it just points to the one real feature that exists.
export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-full bg-flag-green/10 text-flag-green">
          <Bike className="size-6" />
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          ยินดีต้อนรับ
        </h1>
        <p className="text-sm text-muted-foreground">
          เริ่มต้นด้วยการเพิ่มมอเตอร์ไซค์ของคุณ เพื่อบันทึกและติดตามการดูแลรักษา
        </p>
        <Link href="/vehicles" className={buttonVariants({ className: "gap-1.5" })}>
          ไปที่รถของฉัน
          <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
