import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "สมัครสมาชิก | Vehicle Maintenance Log",
};

export default function SignupPage() {
  return <SignupForm />;
}
