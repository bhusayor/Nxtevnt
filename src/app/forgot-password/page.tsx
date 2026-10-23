import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password", description: "Recover access to your NXTEVNT account." };

export default function ForgotPasswordPage() { return <AuthShell><ForgotPasswordForm /></AuthShell>; }
