"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size={iconOnly ? "icon" : "default"}
      className={className}
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label={iconOnly ? "ออกจากระบบ" : undefined}
      title={iconOnly ? "ออกจากระบบ" : undefined}
    >
      {isSigningOut ? <Loader2 className="animate-spin" /> : <LogOut />}
      {!iconOnly && "ออกจากระบบ"}
    </Button>
  );
}
