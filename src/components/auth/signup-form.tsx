"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";

import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { FormField, fieldInputClassName } from "@/components/redesign/form-field";
import { Button } from "@/components/redesign/button";

function translateSignupError(error: AuthError): string {
  switch (error.code) {
    case "user_already_exists":
      return "อีเมลนี้สมัครสมาชิกไว้แล้ว";
    case "email_address_invalid":
      return "รูปแบบอีเมลนี้ไม่ถูกต้องหรือไม่ได้รับอนุญาต กรุณาลองอีเมลอื่น";
    case "over_email_send_rate_limit":
      return "ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
    case "weak_password":
      return "รหัสผ่านคาดเดาง่ายเกินไป กรุณาตั้งรหัสผ่านที่ซับซ้อนขึ้น";
    default:
      return error.message === "User already registered"
        ? "อีเมลนี้สมัครสมาชิกไว้แล้ว"
        : error.message;
  }
}

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values: SignupInput) {
    setFormError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          first_name: values.firstName,
          last_name: values.lastName,
        },
      },
    });

    if (error) {
      setFormError(translateSignupError(error));
      return;
    }

    // If email confirmation is required, Supabase returns no session yet.
    if (!data.session) {
      setAwaitingConfirmation(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (awaitingConfirmation) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-10 text-flag-ok" />
        <p className="font-bold text-ink">ส่งอีเมลยืนยันไปแล้ว</p>
        <p className="text-sm text-ink-muted">
          กรุณาตรวจสอบกล่องอีเมลของคุณและกดลิงก์ยืนยันเพื่อเข้าสู่ระบบ
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5" noValidate>
      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="ชื่อ" htmlFor="firstName" error={errors.firstName?.message}>
          <input
            id="firstName"
            autoComplete="given-name"
            placeholder="สมชาย"
            className={fieldInputClassName({ invalid: !!errors.firstName })}
            {...register("firstName")}
          />
        </FormField>
        <FormField label="นามสกุล" htmlFor="lastName" error={errors.lastName?.message}>
          <input
            id="lastName"
            autoComplete="family-name"
            placeholder="ใจดี"
            className={fieldInputClassName({ invalid: !!errors.lastName })}
            {...register("lastName")}
          />
        </FormField>
      </div>

      <FormField label="อีเมล" htmlFor="email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={fieldInputClassName({ invalid: !!errors.email })}
          {...register("email")}
        />
      </FormField>

      <FormField label="รหัสผ่าน" htmlFor="password" error={errors.password?.message}>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          className={fieldInputClassName({ invalid: !!errors.password })}
          {...register("password")}
        />
      </FormField>

      <FormField label="ยืนยันรหัสผ่าน" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={fieldInputClassName({ invalid: !!errors.confirmPassword })}
          {...register("confirmPassword")}
        />
      </FormField>

      {formError && <p className="text-sm font-bold text-flag-overdue">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting && <Loader2 className="animate-spin" />}
        สมัครสมาชิก
      </Button>

      <p className="text-center text-sm text-ink-muted">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-bold text-cta underline-offset-4 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
