"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { PasswordField } from "@/components/auth/password-field";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/planner");
  }

  return <div className="space-y-7">
    <AuthFormHeader title="Welcome back" description="Sign in to continue managing your events." />
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <Input id="login-email" label="Email address" type="email" inputMode="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <div className="space-y-2"><PasswordField id="login-password" value={password} onValueChange={setPassword} showRequirements={false} autoComplete="current-password" /><div className="flex justify-end"><Link href="/forgot-password" className="type-label text-brand-primary hover:underline hover:underline-offset-4">Forgot password?</Link></div></div>
      <Button type="submit" size="md" fullWidth className="h-11">Sign in</Button>
    </form>
    <AuthDivider />
    <SocialAuthButtons mode="login" />
    <p className="type-body-small text-center text-text-secondary">New to Nxtevnt?{" "}<Link href="/signup" className="font-semibold text-brand-primary hover:underline hover:underline-offset-4">Create an account</Link></p>
  </div>;
}
