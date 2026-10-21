"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { PasswordField } from "@/components/auth/password-field";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { NotificationConsentDetails } from "@/components/auth/notification-consent-details";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { passwordRequirements } from "@/lib/validation/password";

type SignupErrors = Partial<Record<"name" | "email" | "password" | "terms" | "notifications", string>>;

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [notificationsAccepted, setNotificationsAccepted] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const submitDisabled = submitting || !name.trim() || !email.trim() || !password || !termsAccepted || !notificationsAccepted;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: SignupErrors = {};

    if (name.trim().length < 2) nextErrors.name = "Enter your full name";
    if (!validateEmail(email)) nextErrors.email = "Enter a valid email address";
    if (!passwordRequirements.every((requirement) => requirement.test(password))) {
      nextErrors.password = "Your password does not yet meet every requirement";
    }
    if (!termsAccepted) nextErrors.terms = "Accept the Terms & Policies to continue";
    if (!notificationsAccepted) nextErrors.notifications = "Agree to notifications and messages to continue";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    window.sessionStorage.setItem("nxtevnt-signup-name", name.trim());
    router.push("/verify-otp");
  }

  return (
    <div className="space-y-5 md:space-y-3">
      <AuthFormHeader title="Create your account" description="Start planning and managing events in one place." />

      <form className="space-y-4 md:space-y-3" noValidate onSubmit={handleSubmit}>
        <Input
          id="full-name"
          label="Full name"
          placeholder="Enter your full name"
          autoComplete="name"
          required
          disabled={submitting}
          value={name}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value);
            if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
          }}
        />
        <Input
          id="signup-email"
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
        <PasswordField
          id="signup-password"
          value={password}
          onValueChange={(value) => {
            setPassword(value);
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
          error={errors.password}
          autoComplete="new-password"
          disabled={submitting}
        />

        <fieldset className="space-y-2 border-0 p-0">
          <legend className="sr-only">Required agreements</legend>
          <Checkbox
            id="terms-consent"
            required
            disabled={submitting}
            checked={termsAccepted}
            error={errors.terms}
            onCheckedChange={(checked) => {
              setTermsAccepted(checked === true);
              if (errors.terms) setErrors((current) => ({ ...current, terms: undefined }));
            }}
            label={
              <span className="font-normal text-text-secondary">
                I agree to NXTEVNT&apos;s{" "}
                <a
                  href="https://staging.thenxtevnt.com/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-primary underline decoration-brand-primary/35 underline-offset-2 hover:decoration-brand-primary"
                >
                  Terms &amp; Policies
                </a>
                .
              </span>
            }
          />
          <div className="space-y-0.5">
          <Checkbox
            id="notifications-consent"
            name="notificationsConsent"
            required
            disabled={submitting}
            checked={notificationsAccepted}
            error={errors.notifications}
            onCheckedChange={(checked) => {
              setNotificationsAccepted(checked === true);
              if (errors.notifications) setErrors((current) => ({ ...current, notifications: undefined }));
            }}
            label={
              <span className="font-normal leading-5 text-text-secondary">
                I agree to email and text notifications from NXTEVNT for account alerts, event updates and verification codes.
              </span>
            }
          />
          <div className="pl-8"><NotificationConsentDetails /></div>
          </div>
        </fieldset>

        <Button type="submit" size="md" fullWidth className="h-11" loading={submitting} disabled={submitDisabled}>
          Create account
        </Button>
      </form>

      <AuthDivider />
      <SocialAuthButtons mode="signup" disabled={submitting} />

    </div>
  );
}
