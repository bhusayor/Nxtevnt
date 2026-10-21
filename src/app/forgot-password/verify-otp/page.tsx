import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";

export const metadata: Metadata = { title: "Enter reset code", description: "Continue your Nxtevnt password reset." };

export default function ResetOtpPage() {
  return <AuthShell mediaVariant="illustration"><OtpVerificationForm mode="reset" /></AuthShell>;
}
