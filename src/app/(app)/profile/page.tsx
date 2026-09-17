"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdCard, Loader2, Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";
import { buttonVariants } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile/profile-form";
import { DocumentItem } from "@/components/documents/document-item";
import type { Document } from "@/types/database.types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<Document | null | undefined>(undefined);

  useEffect(() => {
    document.title = "โปรไฟล์ | Vehicle Maintenance Log";
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
    });

    apiFetch<{ document: Document | null }>("/api/driving-license").then((result) => {
      setDrivingLicense(result.error ? null : result.data!.document);
    });
  }, [router]);

  function handleLicenseDeleted() {
    setDrivingLicense(null);
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">โปรไฟล์</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <ProfileForm user={user} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold tracking-tight">ใบขับขี่</h2>
        {!drivingLicense && drivingLicense !== undefined && (
          <Link
            href="/profile/driving-license"
            className={buttonVariants({ size: "sm", className: "gap-1.5" })}
          >
            <Plus />
            เพิ่ม
          </Link>
        )}
      </div>

      {drivingLicense === undefined ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : drivingLicense ? (
        <DocumentItem
          document={drivingLicense}
          editHref="/profile/driving-license"
          deleteUrl="/api/driving-license"
          onDeleted={handleLicenseDeleted}
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
