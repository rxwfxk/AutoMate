import { Gauge } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

// Temporary authenticated placeholder — `proxy.ts` already protects this
// route. Gets replaced by the real Dashboard in Step 7.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-full bg-flag-green/10 text-flag-green">
          <Gauge className="size-6" />
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          เข้าสู่ระบบสำเร็จ
        </h1>
        <p className="font-mono text-sm text-muted-foreground">{user?.email}</p>
        <p className="text-sm text-muted-foreground">
          Vehicle Profile, Maintenance Log, Document Tracker และ Dashboard จะมาแทนที่หน้านี้ในขั้นตอนถัดไป
        </p>
        <SignOutButton />
      </div>
    </div>
  );
}
