"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ClipboardList, Clock3, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuestionAnswerField } from "@/components/planner/question-answer-field";
import { isEventCancelled, updatePlannerEvent, useBrowserReady, usePlannerEvents, type PlannerEvent, type SentQuestionnaire } from "@/lib/planner-events";
import { answerIsPresent, questionCount, questionRequiresAnswer } from "@/lib/questionnaires";
import { cn } from "@/lib/utils/cn";

function ClientQuestionnaireForm({ event, questionnaire }: { event: PlannerEvent; questionnaire: SentQuestionnaire }) {
  const [answers, setAnswers] = useState<Record<string, string>>({ ...questionnaire.answers });
  const [activeSection, setActiveSection] = useState(questionnaire.sections[0]?.id ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const section = questionnaire.sections.find((item) => item.id === activeSection) ?? questionnaire.sections[0];
  const total = questionCount(questionnaire);
  const questions = questionnaire.sections.flatMap((item) => item.questions).filter((question) => question.type !== "divider");
  const answered = questions.filter((question) => answerIsPresent(answers[question.id])).length;
  const missingRequired = questions.filter((question) => questionRequiresAnswer(question) && !answerIsPresent(answers[question.id])).length;
  const submitted = questionnaire.status === "submitted";
  const cancelled = isEventCancelled(event);

  function persist(status: SentQuestionnaire["status"]) {
    if (cancelled) return;
    try {
      updatePlannerEvent(event.id, (current) => ({ ...current, questionnaires: (current.questionnaires ?? []).map((item) => item.id === questionnaire.id ? { ...item, answers, status, updatedAt: new Date().toISOString() } : item) }));
      setError("");
      setMessage(status === "submitted" ? "Questionnaire submitted. Your planner can now see your answers." : "Draft saved. You can come back and finish it later.");
    } catch { setError("Your answers couldn’t be saved in this browser. Please try again."); }
  }

  function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (cancelled) return;
    if (missingRequired) { setError(`Answer the remaining ${missingRequired} required ${missingRequired === 1 ? "question" : "questions"} before submitting. You can save a draft now.`); return; }
    persist("submitted");
  }

  return <form onSubmit={submit} className="space-y-5">{cancelled && <div className="rounded-lg border border-[#f0dcdc] bg-[#fcf5f5] px-4 py-3 text-xs text-[#824949]">This event was cancelled. Its questionnaire is available to review, but new answers are closed.</div>}<div className="rounded-xl border border-border-subtle bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-brand-primary">{event.name}</p><h2 className="mt-2 text-xl font-semibold tracking-tight">{questionnaire.title}</h2><p className="mt-1 text-xs text-text-secondary">{cancelled ? "Event cancelled · answers are read-only" : submitted ? "Submitted to your planner" : "Take your time. Save a draft and return whenever you’re ready."}</p></div><span className={cn("rounded-full px-3 py-1 text-xs font-semibold", submitted ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{submitted ? "Submitted" : "Awaiting your answers"}</span></div><div className="mt-5 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eff2ef]"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${total ? answered / total * 100 : 0}%` }} /></div><span className="text-xs text-text-tertiary">{answered} of {total}</span></div></div>
    <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]"><nav aria-label="Questionnaire sections" className="space-y-1 rounded-xl border border-border-subtle bg-white p-2">{questionnaire.sections.map((item) => { const count = item.questions.filter((question) => question.type !== "divider" && answerIsPresent(answers[question.id])).length; return <button key={item.id} type="button" onClick={() => setActiveSection(item.id)} className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3 text-left text-xs", section?.id === item.id ? "bg-[#edf5ef] font-semibold text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}><span>{item.title}</span><span className="shrink-0 text-[0.625rem] text-text-tertiary">{count}/{questionCount({ sections: [item] })}</span></button>; })}</nav><section className="overflow-hidden rounded-xl border border-border-subtle bg-white"><div className="flex items-center justify-between border-b border-border-subtle bg-[#fcfdfc] px-5 py-4"><h3 className="text-sm font-semibold">{section?.title}</h3><span className="text-xs text-text-tertiary">{section ? questionCount({ sections: [section] }) : 0} questions</span></div><div className="space-y-5 p-5 sm:p-6">{section?.questions.map((question, index) => question.type === "divider" ? <div key={question.id} className="border-t border-border-subtle pt-4 text-xs font-semibold text-text-secondary">{question.label}</div> : <div key={question.id}><p className="mb-2 flex items-start gap-2 text-xs font-semibold text-text-primary"><span className="text-text-tertiary">{index + 1}.</span>{question.label}{questionRequiresAnswer(question) && <span className="text-error">*</span>}{answerIsPresent(answers[question.id]) && <Check className="ml-auto size-3.5 shrink-0 text-success" aria-label="Answered" />}</p><QuestionAnswerField question={question} value={answers[question.id] ?? ""} onChange={(value) => { setAnswers((current) => ({ ...current, [question.id]: value })); setMessage(""); }} disabled={submitted} /></div>)}</div></section></div>
    {error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}{message && <p role="status" className="rounded-lg bg-success-soft px-3 py-2 text-xs text-success">{message}</p>}
    {!submitted && !cancelled && <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => persist(answered ? "in-progress" : "pending")}>Save draft</Button><Button type="submit" leadingIcon={<Send className="size-4" aria-hidden="true" />}>Submit questionnaire</Button></div>}
  </form>;
}

export function ClientQuestionnaires() {
  const events = usePlannerEvents();
  const ready = useBrowserReady();
  const requests = events.flatMap((event) => (event.questionnaires ?? []).map((questionnaire) => ({ event, questionnaire }))).sort((a, b) => b.questionnaire.sentAt.localeCompare(a.questionnaire.sentAt));
  const [selectedId, setSelectedId] = useState("");
  const selected = requests.find(({ questionnaire }) => questionnaire.id === selectedId);

  return <div className="mx-auto w-full max-w-6xl space-y-6"><header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-primary">Client workspace</p><h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.04em]">Your questionnaires</h1><p className="mt-2 text-sm text-text-secondary">Share the details that will help shape your event.</p></header><div className="rounded-lg border border-[#dce7f4] bg-[#f0f6fc] px-4 py-3 text-xs leading-5 text-[#526f8d]">Local preview: these questionnaires are shared with the planner workspace in this browser only. Client accounts and email delivery are not connected yet.</div>
    {!ready ? <div className="h-48 animate-pulse rounded-xl bg-white" aria-label="Loading questionnaires" /> : selected ? <><button type="button" onClick={() => setSelectedId("")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"><ArrowLeft className="size-4" aria-hidden="true" />All questionnaires</button><ClientQuestionnaireForm key={selected.questionnaire.id} event={selected.event} questionnaire={selected.questionnaire} /></> : requests.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{requests.map(({ event, questionnaire }) => { const total = questionCount(questionnaire); const answered = questionnaire.sections.flatMap((section) => section.questions).filter((question) => question.type !== "divider" && answerIsPresent(questionnaire.answers[question.id])).length; return <button key={questionnaire.id} type="button" onClick={() => setSelectedId(questionnaire.id)} className="rounded-xl border border-border-subtle bg-white p-5 text-left transition-[border-color,box-shadow] hover:border-brand-primary/40 hover:shadow-sm"><span className="flex size-10 items-center justify-center rounded-xl bg-[#edf4ee] text-brand-primary"><ClipboardList className="size-5" aria-hidden="true" /></span><span className="mt-4 block text-sm font-semibold">{questionnaire.title}</span><span className="mt-1 block text-xs text-text-secondary">{event.name}</span><span className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-xs"><span className="inline-flex items-center gap-1.5 text-text-tertiary"><Clock3 className="size-3.5" aria-hidden="true" />{answered} of {total} answered</span><span className={cn("font-semibold", questionnaire.status === "submitted" ? "text-success" : "text-brand-primary")}>{questionnaire.status === "submitted" ? "Submitted" : "Open"}</span></span></button>; })}</div> : <div className="rounded-xl border border-border-subtle bg-white px-6 py-14 text-center"><ClipboardList className="mx-auto size-7 text-brand-primary" aria-hidden="true" /><h2 className="mt-4 text-base font-semibold">No questionnaires yet</h2><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-text-secondary">When your planner shares a questionnaire, you’ll find it here in the local preview.</p><Link href="/planner" className="mt-5 inline-block text-xs font-semibold text-brand-primary hover:underline">Open planner workspace</Link></div>}
  </div>;
}
