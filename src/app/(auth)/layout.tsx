import { LampAuthShell } from "@/components/auth/lamp-auth-shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LampAuthShell subtitle="บันทึกและติดตามการดูแลรักษามอเตอร์ไซค์ของคุณ">
      {children}
    </LampAuthShell>
  );
}
