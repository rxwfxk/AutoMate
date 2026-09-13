"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, Upload } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { uploadAvatarImage, deleteAvatarImageByUrl } from "@/lib/supabase/storage";
import { getAvatarUrl, getInitials } from "@/lib/user-display";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/validations/vehicle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(getAvatarUrl(user));
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setAvatarError(null);
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setAvatarError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: ProfileInput) {
    setFormError(null);
    setSaved(false);
    const supabase = createClient();

    let avatarUrl = getAvatarUrl(user);
    if (avatarFile) {
      try {
        avatarUrl = await uploadAvatarImage(supabase, user.id, avatarFile);
      } catch {
        setFormError("อัปโหลดรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      const oldAvatarUrl = getAvatarUrl(user);
      if (oldAvatarUrl) {
        await deleteAvatarImageByUrl(supabase, oldAvatarUrl);
      }
    }

    const { error } = await supabase.auth.updateUser({
      data: { first_name: values.firstName, last_name: values.lastName, avatar_url: avatarUrl },
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
      <div className="flex flex-col items-center gap-3">
        <Avatar className="size-24">
          <AvatarImage src={avatarPreview} alt="" />
          <AvatarFallback className="text-xl">{getInitials(user)}</AvatarFallback>
        </Avatar>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleAvatarChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-3.5" />
          {avatarPreview ? "เปลี่ยนรูปโปรไฟล์" : "เพิ่มรูปโปรไฟล์"}
        </Button>
        {avatarError && <p className="text-sm text-flag-red">{avatarError}</p>}
      </div>

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
