"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import { AuthFlowProgress } from "@/components/auth/auth-flow-progress";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const otpLength = 6;

export function OtpVerificationForm({ mode = "signup" }: { mode?: "signup" | "reset" }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(otpLength).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const complete = digits.every(Boolean);
  const completion = `${(digits.filter(Boolean).length / otpLength) * 100}%`;

  useEffect(() => {
    inputRefs.current[0]?.focus();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    if (digit && index < otpLength - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < otpLength - 1) inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, otpLength).split("");
    if (!pastedDigits.length) return;
    event.preventDefault();
    setDigits(Array.from({ length: otpLength }, (_, index) => pastedDigits[index] ?? ""));
    inputRefs.current[Math.min(pastedDigits.length, otpLength) - 1]?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!complete) return;
    setSubmitting(true);
    timerRef.current = setTimeout(() => router.push(mode === "reset" ? "/reset-password" : "/account-type"), 550);
  }

  function resendCode() {
    setDigits(Array(otpLength).fill(""));
    setAnnouncement("A new verification code has been sent.");
    inputRefs.current[0]?.focus();
  }

  return (
    <div className="space-y-8">
      {mode === "signup" && <AuthFlowProgress currentStep={2} />}

      <AuthFormHeader
        title={mode === "reset" ? "Enter your reset code" : "Verify your email"}
        description={mode === "reset" ? "Enter a 6-digit code to continue resetting your password." : "Enter the 6-digit code sent to your email address."}
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => { inputRefs.current[index] = node; }}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Verification code digit ${index + 1}`}
              disabled={submitting}
              className={cn(
                "h-14 min-w-0 rounded-[var(--radius-md)] border bg-surface text-center text-2xl font-semibold tabular-nums text-text-primary shadow-[var(--shadow-xs)] transition-[transform,border-color,background-color,box-shadow] duration-200 focus:border-brand-primary focus:outline-none focus:ring-[3px] focus:ring-brand-primary/12 sm:h-16",
                digit ? "otp-digit-filled border-success bg-success-soft/55 text-success" : "border-border-default hover:border-border-strong",
              )}
            />
          ))}
        </div>

        <div className="h-1 overflow-hidden rounded-full bg-background-subtle" aria-hidden="true">
          <div className="h-full rounded-full bg-brand-primary transition-[width] duration-300 ease-out" style={{ width: completion }} />
        </div>

        <Button type="submit" size="md" fullWidth className="h-11" disabled={!complete || submitting} loading={submitting}>
          {mode === "reset" ? "Continue" : "Verify and continue"}
        </Button>
      </form>

      {mode === "signup" && <div className="flex justify-end text-sm">
        <button type="button" onClick={resendCode} className="font-semibold text-brand-primary hover:underline hover:underline-offset-4">Resend code</button>
      </div>}
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}
