"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: (user.user_metadata?.first_name as string | undefined) ?? "",
      lastName: (user.user_metadata?.last_name as string | undefined) ?? "",
    },
  });

  async function onSubmit(values: ProfileInput) {
    setFormError(null);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { first_name: values.firstName, last_name: values.lastName },
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label>อีเมล</Label>
        <Input value={user.email} readOnly disabled className="font-mono" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">ชื่อ</Label>
          <Input id="firstName" autoComplete="given-name" {...register("firstName")} />
          {errors.firstName && (
            <p className="text-sm text-flag-red">{errors.firstName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">นามสกุล</Label>
          <Input id="lastName" autoComplete="family-name" {...register("lastName")} />
          {errors.lastName && (
            <p className="text-sm text-flag-red">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {formError && <p className="text-sm text-flag-red">{formError}</p>}
      {saved && (
        <p className="flex items-center gap-1.5 text-sm text-flag-green">
          <Check className="size-4" />
          บันทึกแล้ว
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-2 self-start">
        {isSubmitting && <Loader2 className="animate-spin" />}
        บันทึกการเปลี่ยนแปลง
      </Button>
    </form>
  );
}
