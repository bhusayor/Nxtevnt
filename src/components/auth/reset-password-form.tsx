"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { passwordRequirements } from "@/lib/validation/password";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordRequirements.every((requirement) => requirement.test(password))) { setError("Choose a password that meets every requirement."); return; }
    if (password !== confirm) { setError("The passwords do not match."); return; }
    setError("");
    setComplete(true);
  }

  if (complete) return <div className="space-y-7">
    <AuthFormHeader title="You’re all set" description="Your password reset flow is complete. Continue to sign in." />
    <Link href="/login" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:opacity-90">Continue to sign in<ArrowRight className="size-4" aria-hidden="true" /></Link>
  </div>;

  return <div className="space-y-7">
    <AuthFormHeader title="Choose a new password" description="Create a strong password you haven’t used before." />
    <form onSubmit={submit} noValidate className="space-y-5">
      <PasswordField id="reset-password" value={password} onValueChange={(value) => { setPassword(value); setError(""); }} autoComplete="new-password" />
      <div><label htmlFor="reset-confirm" className="mb-2 block text-xs font-semibold text-text-primary">Confirm new password</label><input id="reset-confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => { setConfirm(event.target.value); setError(""); }} className="h-10 w-full rounded-lg border border-border-default bg-white px-3 text-sm outline-none focus:border-brand-primary" /></div>
      {error && <p role="alert" className="rounded-lg bg-error-soft p-3 text-xs text-error">{error}</p>}
      <Button type="submit" fullWidth className="h-11" trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}>Continue</Button>
    </form>
  </div>;
}
