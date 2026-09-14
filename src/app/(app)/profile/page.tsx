import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IdCard, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile/profile-form";
import { DocumentItem } from "@/components/documents/document-item";

export const metadata: Metadata = {
  title: "โปรไฟล์ | Vehicle Maintenance Log",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: drivingLicense } = await supabase
    .from("documents")
    .select("*")
    .eq("document_type", "driving_license")
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">โปรไฟล์</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <ProfileForm user={user} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold tracking-tight">ใบขับขี่</h2>
        {!drivingLicense && (
          <Link
            href="/profile/driving-license"
            className={buttonVariants({ size: "sm", className: "gap-1.5" })}
          >
            <Plus />
            เพิ่ม
          </Link>
        )}
      </div>

      {drivingLicense ? (
        <DocumentItem
          document={drivingLicense}
          editHref="/profile/driving-license"
          revalidateTarget="/profile"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
          <IdCard className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลใบขับขี่</p>
        </div>
      )}
    </div>
  );
}
