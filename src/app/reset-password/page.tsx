import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password", description: "Set a new password for your NXTEVNT account." };

export default function ResetPasswordPage() { return <AuthShell><ResetPasswordForm /></AuthShell>; }
