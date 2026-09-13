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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <MailCheck className="size-10 text-flag-green" />
        <p className="text-foreground">ส่งอีเมลยืนยันไปแล้ว</p>
        <p className="text-sm text-muted-foreground">
          กรุณาตรวจสอบกล่องอีเมลของคุณและกดลิงก์ยืนยันเพื่อเข้าสู่ระบบ
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">ชื่อ</Label>
          <Input id="firstName" autoComplete="given-name" placeholder="สมชาย" {...register("firstName")} />
          {errors.firstName && (
            <p className="text-sm text-flag-red">{errors.firstName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">นามสกุล</Label>
          <Input id="lastName" autoComplete="family-name" placeholder="ใจดี" {...register("lastName")} />
          {errors.lastName && (
            <p className="text-sm text-flag-red">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-flag-red">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-flag-red">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-flag-red">{errors.confirmPassword.message}</p>
        )}
      </div>

      {formError && <p className="text-sm text-flag-red">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting && <Loader2 className="animate-spin" />}
        สมัครสมาชิก
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
