import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DrivingLicenseForm } from "@/components/documents/driving-license-form";

export const metadata: Metadata = {
  title: "ใบขับขี่ | Vehicle Maintenance Log",
};

export default async function DrivingLicensePage() {
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
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        {drivingLicense ? "แก้ไขใบขับขี่" : "เพิ่มใบขับขี่"}
      </h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <DrivingLicenseForm document={drivingLicense ?? undefined} />
      </div>
    </div>
  );
}
