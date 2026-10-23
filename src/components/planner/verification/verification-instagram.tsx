"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasInstagramProof, normalizeInstagramHandle, type InstagramProof } from "@/lib/verification-model";
import type { InstagramChallenge, VerificationService } from "@/lib/verification-service";
import type { VerificationFieldProps } from "./verification-fields";

export function VerificationInstagram({ draft, update, service }: VerificationFieldProps & { service: VerificationService }) {
  const handle = normalizeInstagramHandle(draft.instagram);
  const [challenge, setChallenge] = useState<InstagramChallenge | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const epoch = useRef(0), locked = useRef(false), target = useRef(handle); target.current = handle;
  useEffect(() => { epoch.current++; locked.current = false; setBusy(false); setChallenge(null); setError(""); setNotice(""); return () => { epoch.current++; }; }, [handle]);
  const active = challenge?.handle === handle ? challenge : null;
  const confirmed = hasInstagramProof(draft.instagram, draft.instagramProof);
  function accept(proof: InstagramProof) {
    if (!hasInstagramProof(handle, proof) || (service.mode === "walkthrough" ? proof.mode !== "walkthrough" : proof.mode === "walkthrough")) throw new Error("We couldn’t confirm this Instagram account. Check the username and try again.");
    update({ instagramProof: proof }); setChallenge(null); setNotice("");
  }
  async function run(action: "request" | "check" | "test") {
    if (!handle || locked.current || action !== "request" && !active) return;
    const generation = ++epoch.current; locked.current = true; setBusy(true); setError(""); setNotice("");
    try {
      if (action === "request") {
        if (!service.requestInstagramCode) throw new Error("Instagram verification isn’t configured yet.");
        const result = await service.requestInstagramCode(handle);
        if (generation !== epoch.current || handle !== target.current) return;
        if (!result.id || result.handle !== handle || !/^[A-Za-z0-9-]{6,64}$/.test(result.code) || !Number.isFinite(Date.parse(result.expiresAt)) || Date.parse(result.expiresAt) <= Date.now()) throw new Error("We couldn’t generate a valid Instagram code. Please try again.");
        setChallenge(result);
      } else if (active) {
        if (Date.now() >= Date.parse(active.expiresAt)) throw new Error("This Instagram code has expired. Generate a new one.");
        if (action === "test") {
          if (service.mode !== "walkthrough" || !service.confirmInstagramWalkthrough) throw new Error("A test confirmation is not available in the live flow.");
          const proof = await service.confirmInstagramWalkthrough(active);
          if (generation === epoch.current && handle === target.current) accept(proof);
        } else {
          if (!service.checkInstagram) throw new Error("Instagram confirmation isn’t connected yet.");
          const result = await service.checkInstagram(active);
          if (generation !== epoch.current || handle !== target.current) return;
          if (result.status === "verified") accept(result.proof);
          else if (result.status === "pending") setNotice("Awaiting confirmation. Your account is not verified yet.");
          else throw new Error("We couldn’t confirm the status. Please try again.");
        }
      }
    } catch (problem) { if (generation === epoch.current) setError(problem instanceof Error ? problem.message : "The Instagram check couldn’t be completed."); }
    finally { if (generation === epoch.current) { locked.current = false; setBusy(false); } }
  }
  async function copy() {
    if (!active) return; const generation = epoch.current;
    try { await navigator.clipboard.writeText(active.code); if (generation === epoch.current) setNotice("Code copied."); }
    catch { if (generation === epoch.current) setError("Copy isn’t available. Select and copy the code shown above instead."); }
  }
  const recipient = active?.recipientUrl && normalizeInstagramHandle(active.recipientUrl);
  return <div className="space-y-3">
    <Input label="Instagram username or profile link" maxLength={200} autoComplete="off" placeholder="e.g. @yourplanningbrand" value={draft.instagram || ""} helperText="Use the business account you want clients to see." onChange={(event) => update({ instagram: event.target.value, instagramProof: undefined })} />
    {confirmed ? <p role="status" className="flex items-center gap-1.5 text-xs text-brand-primary"><Check className="size-3.5" />{draft.instagramProof?.mode === "walkthrough" ? "Instagram flow complete in test mode" : "Instagram ownership confirmed"}</p> : active ? <div className="space-y-4 rounded-xl border border-border-subtle bg-[#fafbf8] p-4">
      <ol className="space-y-2 text-xs leading-6 text-text-secondary"><li><span className="font-semibold text-text-primary">1. Copy your code.</span> It belongs to @{handle} and expires in 10 minutes.</li><li><span className="font-semibold text-text-primary">2. Send it from that Instagram account.</span> {recipient ? <>Message <a href={`https://www.instagram.com/${recipient}/`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary underline">@{recipient}</a>, then return here.</> : "The receiving account is not configured. Don’t send this code anywhere yet."}</li><li><span className="font-semibold text-text-primary">3. Check confirmation.</span> Only a confirmed message proves ownership.</li></ol>
      <div className="flex items-end gap-2"><div className="min-w-0 flex-1"><Input label="Your verification code" readOnly value={active.code} className="font-mono tracking-wider" onFocus={(event) => event.target.select()} /></div><Button type="button" variant="outline" size="md" aria-label="Copy Instagram code" leadingIcon={<Copy className="size-4" />} onClick={() => { void copy(); }}>Copy</Button></div>
      <div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => { void run("check"); }}>Check confirmation</Button><button type="button" disabled={busy} className="min-h-9 text-xs font-semibold text-brand-primary hover:underline disabled:opacity-40" onClick={() => { void run("request"); }}>Generate new code</button></div>
      {service.mode === "walkthrough" && service.confirmInstagramWalkthrough && <div className="border-t border-border-subtle pt-3"><p className="text-[0.6875rem] leading-5 text-text-tertiary">Test mode: no Instagram message is sent or checked. You can complete the interaction below without verifying a real account.</p><button type="button" disabled={busy} className="mt-1 min-h-9 text-xs font-semibold text-brand-primary underline disabled:opacity-40" onClick={() => { void run("test"); }}>Complete test confirmation</button></div>}
    </div> : <><Button type="button" variant="outline" size="sm" disabled={!handle || busy} loading={busy} onClick={() => { void run("request"); }}>Verify Instagram</Button><p className="text-[0.6875rem] leading-5 text-text-tertiary">The official receiving account is not configured yet. Once ownership is confirmed, this account can be shown on your public profile.</p></>}
    {error && <p role="alert" className="text-xs leading-5 text-error">{error}</p>}{notice && <p role="status" className="text-xs leading-5 text-text-secondary">{notice}</p>}
  </div>;
}
