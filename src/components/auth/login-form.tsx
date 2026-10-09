"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { PasswordField } from "@/components/auth/password-field";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginErrors = Partial<Record<"email" | "password", string>>;

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitDisabled = submitting || !email.trim() || !password;

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: LoginErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Enter your password";
    setErrors(nextErrors);
    setAuthError("");
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    timerRef.current = setTimeout(() => {
      setSubmitting(false);
      setAuthError("We couldn’t sign you in with those details. Check them and try again.");
    }, 1100);
  }

  return (
    <div className="space-y-7">
      <AuthFormHeader title="Welcome back" description="Sign in to continue managing your events." />

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <Input
          id="login-email"
          label="Email address"
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={submitting}
          value={email}
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
          }}
        />

        <div className="space-y-2">
          <PasswordField
            id="login-password"
            value={password}
            onValueChange={(value) => {
              setPassword(value);
              if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
            }}
            error={errors.password}
            showRequirements={false}
            autoComplete="current-password"
            disabled={submitting}
          />
          <div className="flex justify-end">
            <button type="button" className="type-label text-brand-primary hover:underline hover:underline-offset-4">
              Forgot password?
            </button>
          </div>
        </div>

        {authError ? (
          <div className="flex gap-2 rounded-[var(--radius-md)] border border-error/20 bg-error-soft px-3.5 py-3 text-sm text-error" role="alert">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{authError}</span>
          </div>
        ) : null}

        <Button type="submit" size="md" fullWidth className="h-11" loading={submitting} disabled={submitDisabled}>
          Sign in
        </Button>
      </form>

      <AuthDivider />
      <SocialAuthButtons mode="login" disabled={submitting} />

      <p className="type-body-small text-center text-text-secondary">
        New to Nxtevnt?{" "}
        <Link href="/signup" className="font-semibold text-brand-primary hover:underline hover:underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
