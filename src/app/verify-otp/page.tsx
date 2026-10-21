import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Verify your Nxtevnt account email.",
};

export default function VerifyOtpPage() {
  return (
    <AuthShell mediaVariant="illustration">
      <OtpVerificationForm />
    </AuthShell>
  );
}
