"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";

import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[A-Za-z]{2,}$/.test(address)) {
      setError("Enter a valid email address, such as johndoe@gmail.com.");
      return;
    }
    setError("");
    router.push("/forgot-password/verify-otp");
  }

  return <div className="space-y-7">
    <AuthFormHeader title="Forgot your password?" description="Enter the email address linked to your account to continue." />
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input id="forgot-email" label="Email address" type="email" inputMode="email" autoComplete="email" placeholder="johndoe@gmail.com" value={email} error={error} onChange={(event) => { setEmail(event.target.value); if (error) setError(""); }} />
      <button type="button" onClick={() => { setEmail(""); setError(""); document.getElementById("forgot-email")?.focus(); }} className="text-xs font-semibold text-brand-primary hover:underline">Use another email</button>
      <Button type="submit" fullWidth className="h-11" disabled={!email.trim()} trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}>Continue</Button>
    </form>
    <Link href="/login" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-brand-primary hover:underline"><ArrowLeft className="size-4" aria-hidden="true" />Back to sign in</Link>
  </div>;
}
