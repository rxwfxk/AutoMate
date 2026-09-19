"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { FormField, fieldInputClassName } from "@/components/redesign/form-field";
import { Button } from "@/components/redesign/button";

function translateLoginError(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "email_not_confirmed":
      return "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (เช็คกล่องอีเมลของคุณ)";
    case "over_request_rate_limit":
      return "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
    default:
      return error.message === "Invalid login credentials"
        ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        : error.message;
  }
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setFormError(translateLoginError(error));
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5" noValidate>
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
          autoComplete="current-password"
          placeholder="••••••••"
          className={fieldInputClassName({ invalid: !!errors.password })}
          {...register("password")}
        />
      </FormField>

      {formError && <p className="text-sm font-bold text-flag-overdue">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting && <Loader2 className="animate-spin" />}
        เข้าสู่ระบบ
      </Button>

      <p className="text-center text-sm text-ink-muted">
        ยังไม่มีบัญชี?{" "}
        <Link href="/signup" className="font-bold text-cta underline-offset-4 hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </form>
  );
}
