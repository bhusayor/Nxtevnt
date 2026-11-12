"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { guestWorkspaceData, type EventGuest, type GuestWorkspaceData, type GuestQuestion } from "@/lib/event-guests";
import { updatePlannerEvent, usePlannerEvents } from "@/lib/planner-events";

type Kind = "collect" | "rsvp";
type Question = GuestQuestion | GuestWorkspaceData["rsvpForm"]["questions"][number];

export function GuestPublicForm({ id, kind }: { id: string; kind: Kind }) {
  const event = usePlannerEvents().find((item) => item.id === id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  if (!event) return <main className="mx-auto flex min-h-dvh max-w-xl items-center justify-center p-6"><div className="rounded-2xl border border-border-subtle bg-white p-8 text-center"><h1 className="text-xl font-semibold">Form unavailable</h1><p className="mt-2 text-sm text-text-secondary">Open this link in the browser where the event is saved.</p></div></main>;

  const data = guestWorkspaceData(event.guestWorkspace);
  const sections = kind === "collect" ? data.collector.sections : data.rsvpForm.sections;
  const questions: Question[] = kind === "collect" ? data.questions : data.rsvpForm.questions;
  const firstSection = sections[0]?.id;
  const closed = kind === "collect" && (data.collector.closed || Boolean(data.collector.closesOn && data.collector.closesOn < new Date().toISOString().slice(0, 10)));
  const answerFor = (pattern: RegExp) => questions.find((question) => pattern.test(question.label))?.id;

  function submit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    setMessage("");
    if (closed) { setMessage("This form is closed."); return; }
    const missing = questions.find((question) => question.required && !answers[question.id]?.trim());
    if (missing) { setMessage(`Please answer “${missing.label}”.`); return; }
    const name = answers[answerFor(/your name|full name/i) ?? ""]?.trim() ?? "";
    const phone = answers[answerFor(/phone|whatsapp/i) ?? ""]?.trim() ?? "";
    const email = answers[answerFor(/email/i) ?? ""]?.trim() ?? "";
    if (!name || (!phone && !email)) { setMessage("Add your name and a phone number or email."); return; }
    const adults = Math.max(0, Number(answers[answerFor(/adults/i) ?? ""] ?? 1) || 0);
    const children = Math.max(0, Number(answers[answerFor(/children/i) ?? ""] ?? 0) || 0);
    const extras = questions.filter((question) => !/your name|full name|phone|whatsapp|email|adults|children/i.test(question.label) && answers[question.id]?.trim()).map((question) => `${question.label}: ${answers[question.id].trim()}`);
    if (kind === "rsvp") {
      const reply = answers[answerFor(/will you be coming|attend/i) ?? ""];
      const rsvp = reply === "Yes" ? "coming" as const : reply === "No" ? "not-coming" as const : "maybe" as const;
      const existing = data.guests.find((guest) => (phone && guest.phone === phone) || (email && guest.email.toLowerCase() === email.toLowerCase()) || guest.name.toLowerCase() === name.toLowerCase());
      if (!existing && !data.rsvpForm.allowSelfAdded) { setMessage("This form is for guests already on the list. Please contact the host."); return; }
      updatePlannerEvent(id, (current) => {
        const workspace = guestWorkspaceData(current.guestWorkspace);
        const patch = { rsvp, responseAt: new Date().toISOString(), responseChannel: "Collector" as const, adults, children, dietary: extras.join(" · ") };
        const guest: EventGuest = { id: crypto.randomUUID(), name, phone, email, group: "", tags: [], ...patch };
        return { ...current, guestWorkspace: { ...workspace, guests: existing ? workspace.guests.map((item) => item.id === existing.id ? { ...item, ...patch } : item) : [...workspace.guests, guest] } };
      });
    } else {
      updatePlannerEvent(id, (current) => {
        const workspace = guestWorkspaceData(current.guestWorkspace);
        return { ...current, guestWorkspace: { ...workspace, collectorResponses: [{ id: crypto.randomUUID(), name, phone, email, adults, children, answers: extras.join(" · "), receivedAt: new Date().toISOString(), status: "new" as const }, ...workspace.collectorResponses] } };
      });
    }
    setSent(true);
  }

  return <main className="min-h-dvh bg-[linear-gradient(145deg,#f1f7f3,#fbfaf5)] px-4 py-8 text-text-primary sm:py-12"><div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[0_18px_60px_rgba(22,61,45,0.08)]"><header className="bg-[#edf3ef] px-6 py-6"><span className="text-xs font-bold tracking-[0.14em] text-brand-primary">NXTEVNT</span><h1 className="mt-3 text-2xl font-semibold leading-tight">{event.name}</h1><p className="mt-2 text-sm leading-6 text-text-secondary">{kind === "collect" ? data.collector.hostLine : "Please let us know if you can join us."}</p></header>{sent ? <div className="px-6 py-12 text-center"><h2 className="text-xl font-semibold">Thank you for responding</h2><p className="mt-2 text-sm text-text-secondary">Your details have been saved.</p></div> : <form onSubmit={submit} className="space-y-6 px-6 py-6">{sections.map((section, index) => <section key={section.id}><h2 className="mb-4 border-b border-border-subtle pb-2 text-sm font-semibold">{index + 1}. {section.title}</h2><div className="space-y-4">{questions.filter((question) => (question.sectionId ?? firstSection) === section.id).map((question) => <label key={question.id} className="block"><span className="mb-1.5 block text-sm font-medium">{question.label}{question.required && <span className="text-error"> *</span>}</span>{question.type === "Long answer" ? <textarea value={answers[question.id] ?? ""} onChange={(changeEvent) => setAnswers({ ...answers, [question.id]: changeEvent.target.value })} className="min-h-24 w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary" /> : question.type === "Yes or no" ? <select value={answers[question.id] ?? ""} onChange={(changeEvent) => setAnswers({ ...answers, [question.id]: changeEvent.target.value })} className="h-10 w-full rounded-lg border border-border-default bg-white px-3 text-sm outline-none focus:border-brand-primary"><option value="">Choose</option><option value="Yes">Yes</option><option value="No">No</option></select> : <input value={answers[question.id] ?? ""} onChange={(changeEvent) => setAnswers({ ...answers, [question.id]: changeEvent.target.value })} type={/email/i.test(question.label) ? "email" : question.type === "Number" ? "number" : "text"} min={question.type === "Number" ? 0 : undefined} className="h-10 w-full rounded-lg border border-border-default bg-white px-3 text-sm outline-none focus:border-brand-primary" />}</label>)}</div></section>)}{message && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">{message}</p>}<Button type="submit" fullWidth disabled={closed}>{closed ? "Form closed" : kind === "collect" ? "Submit my details" : "Send RSVP"}</Button></form>}</div></main>;
}
