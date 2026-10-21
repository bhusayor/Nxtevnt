"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, ShieldCheck } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePlannerVerified } from "@/lib/planner-business";
import { useVerificationCheckpoint } from "@/lib/planner-verification";

const verificationStorageKey = "nxtevnt-planner-verification-started";
const verificationEvent = "nxtevnt-verification-change";

function subscribeToVerification(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(verificationEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(verificationEvent, callback);
  };
}

function getVerificationSnapshot() {
  try { return window.localStorage.getItem(verificationStorageKey) === "true"; } catch { return false; }
}

export function VerificationPrompt() {
  const router = useRouter();
  const legacyStarted = useSyncExternalStore(subscribeToVerification, getVerificationSnapshot, () => false);
  const checkpoint = useVerificationCheckpoint();
  const started = legacyStarted || Boolean(checkpoint.updatedAt);
  const verified = usePlannerVerified();

  function openVerification() {
    router.push("/planner/verification");
  }

  if (verified) return null;
  return (
    <section className="rounded-xl border border-[#dce7f4] bg-[#edf4fc] px-4 py-4 sm:px-5" aria-labelledby="verification-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white bg-white/80 text-[#5180af] shadow-[0_2px_8px_-5px_rgba(49,95,120,0.3)]">
            {started ? <BadgeCheck aria-hidden="true" className="size-6" weight="regular" /> : <ShieldCheck aria-hidden="true" className="size-6" weight="regular" />}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="verification-title" className="text-sm font-semibold text-text-primary">
                {started ? "Continue your verification" : "Verify your planner profile"}
              </h2>
              <StatusBadge status={started ? "in-progress" : "unverified"}>{started ? "In progress" : "Not started"}</StatusBadge>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-text-secondary">
              {started
                ? "Pick up where you stopped to complete your identity and business checks."
                : "Build trust with clients. Get your verified planner badge."}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="md" className="w-full border-[#ccdbed] bg-white/80 text-xs sm:w-auto" trailingIcon={<ArrowRight aria-hidden="true" className="size-3.5" />} onClick={openVerification}>
          {started ? "Continue verification" : "Start verification"}
        </Button>
      </div>
    </section>
  );
}
