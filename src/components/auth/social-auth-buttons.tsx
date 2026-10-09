"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5 shrink-0">
      <path fill="#FFC107" d="M43.61 20.08H42V20H24v8h11.3A12 12 0 1 1 31.9 15.1l5.66-5.66A19.9 19.9 0 1 0 44 24c0-1.34-.14-2.65-.39-3.92Z" />
      <path fill="#FF3D00" d="m6.31 14.69 6.57 4.82A12 12 0 0 1 31.9 15.1l5.66-5.66A20 20 0 0 0 6.31 14.69Z" />
      <path fill="#4CAF50" d="M24 44c5.1 0 9.74-1.92 13.27-5.04l-6.15-5.2A12 12 0 0 1 12.91 28.4l-6.52 5.02A20 20 0 0 0 24 44Z" />
      <path fill="#1976D2" d="M43.61 20.08H42V20H24v8h11.3a12.04 12.04 0 0 1-4.18 5.76l.01-.01 6.15 5.2C36.84 39.36 44 34 44 24c0-1.34-.14-2.65-.39-3.92Z" />
    </svg>
  );
}

export function SocialAuthButtons({ mode, disabled = false }: { mode: "signup" | "login"; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function handleGoogle() {
    setLoading(true);
    timerRef.current = setTimeout(() => {
      if (mode === "signup") {
        router.push("/verify-otp");
        return;
      }
      setLoading(false);
    }, 350);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      fullWidth
      className="h-11 gap-2.5"
      disabled={disabled || loading}
      loading={loading}
      leadingIcon={<GoogleIcon />}
      onClick={handleGoogle}
    >
      {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
    </Button>
  );
}
