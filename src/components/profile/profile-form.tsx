"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, Upload } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "cn";

import { createClient } from "@/lib/supabase/client";
import { uploadAvatarImage, deleteAvatarImageByUrl } from "@/lib/supabase/storage";
import { getAvatarUrl, getInitials } from "@/lib/user-display";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/validations/vehicle";
import { FormField, fieldInputClassName } from "@/components/redesign/form-field";
import { Button } from "@/components/redesign/button";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(getAvatarUrl(user));
  const fileInputRef = useRef<HTMLInputElement>(null);
  // See vehicle-form.tsx — guards a double-click that lands before isSubmitting flips.
  const submittingRef = useRef(false);

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

  function guardedSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    void handleSubmit(onSubmit)(e).finally(() => {
      submittingRef.current = false;
    });
  }

  return (
    <form onSubmit={guardedSubmit} className="flex flex-col gap-3.5" noValidate>
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-line-strong bg-surface text-xl font-extrabold text-ink-muted">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" className="size-full object-cover" />
          ) : (
            getInitials(user)
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleAvatarChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-button border border-line-strong px-4 py-2 text-sm font-bold text-ink"
        >
          <Upload className="size-3.5" />
          {avatarPreview ? "เปลี่ยนรูปโปรไฟล์" : "เพิ่มรูปโปรไฟล์"}
        </button>
        {avatarError && <p className="text-xs font-bold text-flag-overdue">{avatarError}</p>}
      </div>

      <FormField label="อีเมล">
        <input
          value={user.email}
          readOnly
          disabled
          className={cn(fieldInputClassName(), "font-mono disabled:opacity-60")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="ชื่อ" htmlFor="firstName" error={errors.firstName?.message}>
          <input
            id="firstName"
            autoComplete="given-name"
            className={fieldInputClassName({ invalid: !!errors.firstName })}
            {...register("firstName")}
          />
        </FormField>
        <FormField label="นามสกุล" htmlFor="lastName" error={errors.lastName?.message}>
          <input
            id="lastName"
            autoComplete="family-name"
            className={fieldInputClassName({ invalid: !!errors.lastName })}
            {...register("lastName")}
          />
        </FormField>
      </div>

      {formError && <p className="text-sm font-bold text-flag-overdue">{formError}</p>}
      {saved && (
        <p className="flex items-center gap-1.5 text-sm font-bold text-flag-ok">
          <Check className="size-4" />
          บันทึกแล้ว
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-1 self-start">
        {isSubmitting && <Loader2 className="animate-spin" />}
        บันทึกการเปลี่ยนแปลง
      </Button>
    </form>
  );
}
