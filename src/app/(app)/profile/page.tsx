import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "โปรไฟล์ | Vehicle Maintenance Log",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">โปรไฟล์</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
