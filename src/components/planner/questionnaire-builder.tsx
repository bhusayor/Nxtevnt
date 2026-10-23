"use client";

import { ConfirmDeleteButton } from "@/components/ui/delete-confirmation";

import { useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDown, ArrowUp, Check, Copy, Eye, Pencil, Plus, Send, Trash2, X } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { assertPlannerQuestionnaireSlot, sendPlannerQuestionnaire, type PlannerEvent, type QuestionnaireQuestion, type QuestionnaireQuestionType, type QuestionnaireSection, type SentQuestionnaire } from "@/lib/planner-events";
import { needsOptions, questionCount, questionTypeGroups, saveQuestionnaireTemplate } from "@/lib/questionnaires";
import { cn } from "@/lib/utils/cn";

const categories = ["Wedding", "Birthday & celebration", "Corporate event", "Conference", "Concert & performance", "Party", "Other"];
const categoryFor = (type: string) => categories.includes(type) ? type : "Other";
const freshQuestion = (type: QuestionnaireQuestionType = "short"): QuestionnaireQuestion => ({ id: crypto.randomUUID(), label: type === "divider" ? "Section divider" : "", type, required: type !== "divider", options: needsOptions(type) ? ["Option 1", "Option 2"] : undefined });
const freshSection = (number: number): QuestionnaireSection => ({ id: crypto.randomUUID(), title: `Section ${number}`, questions: [freshQuestion()] });

function SectionTitleEditor({ title, number, total, onChange }: { title: string; number: number; total: number; onChange: (title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const cancelled = useRef(false);

  function beginEditing() {
    cancelled.current = false;
    setDraft(title);
    setEditing(true);
  }

  function save() {
    onChange(draft.trim() || `Section ${number}`);
    setEditing(false);
  }

  return <div className="min-w-0 flex-1">
    <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">Section {number} of {total}</p>
    {editing ? <div className="mt-1.5 flex min-w-0 items-center gap-2">
      <input autoFocus aria-label={`Section ${number} title`} value={draft} onChange={(change) => setDraft(change.target.value)} onFocus={(event) => event.currentTarget.select()} onBlur={() => { if (!cancelled.current) save(); }} onKeyDown={(event) => {
        if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
        if (event.key === "Escape") { event.preventDefault(); cancelled.current = true; setEditing(false); }
      }} placeholder="Name this section" className="h-10 min-w-0 flex-1 rounded-lg border border-brand-primary bg-white px-3 text-sm font-semibold outline-none ring-2 ring-brand-primary/10" />
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={save} aria-label={`Save section ${number} title`} className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary bg-[image:var(--action-primary-gradient)] hover:bg-[image:var(--action-primary-gradient-hover)] active:bg-[image:var(--action-primary-gradient-active)] text-white hover:opacity-90"><Check className="size-4" aria-hidden="true" /></button>
    </div> : <button type="button" onClick={beginEditing} aria-label={`Edit section ${number} title: ${title}`} className="group mt-1 flex max-w-full items-center gap-2 rounded-md py-1 text-left text-sm font-semibold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">
      <span className="min-w-0 break-words">{title || `Section ${number}`}</span><Pencil className="size-3.5 shrink-0 text-text-tertiary transition-colors group-hover:text-brand-primary" aria-hidden="true" /><span className="shrink-0 text-[0.6875rem] font-medium text-text-tertiary group-hover:text-brand-primary">Edit title</span>
    </button>}
  </div>;
}

function QuestionPreview({ question, index }: { question: QuestionnaireQuestion; index: number }) {
  const type = question.type ?? "short";
  if (type === "divider") return <div className="border-t border-border-subtle py-3 text-xs font-semibold text-text-secondary">{question.label || "Divider"}</div>;
  const choice = type === "single" || type === "multiple" || type === "yes-no";
  return <div className="space-y-2 border-b border-border-subtle pb-5 last:border-b-0"><p className="text-xs font-semibold text-text-primary"><span className="mr-2 text-text-tertiary">{index + 1}.</span>{question.label}{question.required !== false && <span className="ml-1 text-error">*</span>}</p>{choice ? <div className="space-y-2">{(type === "yes-no" ? ["Yes", "No"] : question.options ?? ["Option 1", "Option 2"]).map((option) => <div key={option} className="flex items-center gap-2 text-xs text-text-secondary"><span className={cn("size-3.5 border border-border-strong", type === "single" || type === "yes-no" ? "rounded-full" : "rounded-sm")} />{option}</div>)}</div> : type === "dropdown" ? <div className="rounded-lg border border-border-default px-3 py-2.5 text-xs text-text-tertiary">Choose an option ▾</div> : type === "checkbox" ? <div className="flex items-center gap-2 text-xs text-text-secondary"><span className="size-3.5 rounded-sm border border-border-strong" />I agree</div> : type === "photo" || type === "file" ? <div className="rounded-lg border border-dashed border-border-strong px-3 py-4 text-center text-xs text-text-tertiary">{type === "photo" ? "Choose a photo" : "Choose a file"}</div> : <div className="rounded-lg border border-border-default px-3 py-2.5 text-xs text-text-tertiary">{type === "long" ? "Long answer" : type === "date-range" ? "Select start and end dates" : `Your ${type === "short" ? "answer" : type}`}</div>}</div>;
}

type BuilderProps = { mode?: "event"; event: PlannerEvent; onSent: (id: string) => void } | { mode: "template"; event?: never; onSent?: never };

export function QuestionnaireBuilder(props: BuilderProps) {
  const event = props.mode === "template" ? null : props.event;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categoryFor(event?.type ?? "Wedding"));
  const [otherCategory, setOtherCategory] = useState(categoryFor(event?.type ?? "Wedding") === "Other" ? event?.type ?? "" : "");
  const [sections, setSections] = useState<QuestionnaireSection[]>([{ id: "new-section", title: "Section 1", questions: [{ id: "new-question", label: "", type: "short", required: true }] }]);
  const [preview, setPreview] = useState(false);
  const [previewSectionId, setPreviewSectionId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const previewSection = sections.find((section) => section.id === previewSectionId) ?? sections[0];

  function updateSection(sectionId: string, patch: Partial<QuestionnaireSection>) {
    setSections((current) => current.map((section) => section.id === sectionId ? { ...section, ...patch } : section));
    setError("");
  }

  function updateQuestion(sectionId: string, questionId: string, patch: Partial<QuestionnaireQuestion>) {
    setSections((current) => current.map((section) => section.id === sectionId ? { ...section, questions: section.questions.map((question) => question.id === questionId ? { ...question, ...patch } : question) } : section));
    setError("");
  }

  function addQuestion(sectionId: string, type: QuestionnaireQuestionType) {
    setSections((current) => current.map((section) => section.id === sectionId ? { ...section, questions: [...section.questions, freshQuestion(type)] } : section));
    setError("");
  }

  function removeQuestion(sectionId: string, questionId: string) {
    setSections((current) => current.map((section) => section.id === sectionId ? { ...section, questions: section.questions.filter((question) => question.id !== questionId) } : section));
  }

  function moveQuestion(sectionId: string, index: number, direction: -1 | 1) {
    setSections((current) => current.map((section) => {
      if (section.id !== sectionId) return section;
      const questions = [...section.questions];
      const target = index + direction;
      if (target < 0 || target >= questions.length) return section;
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...section, questions };
    }));
  }

  function valid() {
    if (!title.trim()) { setError("Give this questionnaire a title."); return false; }
    if (category === "Other" && !otherCategory.trim()) { setError("Enter the event type."); return false; }
    if (!sections.length || sections.some((section) => !section.title.trim() || !section.questions.some((question) => question.type !== "divider"))) { setError("Each section needs a title and at least one question."); return false; }
    if (sections.some((section) => section.questions.some((question) => !question.label.trim()))) { setError("Write a title for every question and divider."); return false; }
    if (sections.some((section) => section.questions.some((question) => needsOptions(question.type ?? "short") && (question.options ?? []).filter((option) => option.trim()).length < 2))) { setError("Choice questions need at least two options."); return false; }
    setError("");
    return true;
  }

  function startSend() {
    if (!valid()) return;
    if (props.mode === "template") {
      const normalized = sections.map((section) => ({ ...section, title: section.title.trim(), questions: section.questions.map((question) => ({ ...question, label: question.label.trim(), options: question.options?.map((option) => option.trim()).filter(Boolean) })) }));
      try { saveQuestionnaireTemplate({ title: title.trim(), category: category === "Other" ? otherCategory.trim() : category, sections: normalized }); setTitle(""); setSections([freshSection(1)]); setPreview(false); setError(""); setSuccess("Template saved. It’s now available when you choose a template from an event."); }
      catch { setError("The template couldn’t be saved in this browser. Please try again."); }
      return;
    }
    setSaveTemplate(false); setTemplateTitle(""); setConfirmOpen(true);
  }

  function send(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!event || props.mode === "template") return;
    if (saveTemplate && !templateTitle.trim()) { setError("Give the reusable template a title."); return; }
    const normalized = sections.map((section) => ({ ...section, title: section.title.trim(), questions: section.questions.map((question) => ({ ...question, label: question.label.trim(), options: question.options?.map((option) => option.trim()).filter(Boolean) })) }));
    const selectedCategory = category === "Other" ? otherCategory.trim() : category;
    try {
      assertPlannerQuestionnaireSlot(event.id);
      const template = saveTemplate ? saveQuestionnaireTemplate({ title: templateTitle.trim(), category: selectedCategory, sections: structuredClone(normalized) }) : null;
      const request: SentQuestionnaire = { id: crypto.randomUUID(), templateId: template?.id ?? "one-off", title: title.trim(), category: selectedCategory, sections: structuredClone(normalized), answers: {}, status: "pending", sentAt: new Date().toISOString() };
      sendPlannerQuestionnaire(event.id, request);
      setConfirmOpen(false); setError(""); props.onSent(request.id);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "This questionnaire couldn’t be saved in this browser. Please try again."); }
  }

  return <div className="space-y-5 rounded-[1.25rem] border border-border-subtle bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[0.6875rem] font-bold uppercase tracking-wider text-brand-primary">Build from scratch</p><h4 className="mt-1 text-lg font-semibold tracking-tight">{props.mode === "template" ? "Create a template" : "Create a questionnaire"}</h4><p className="mt-1 text-xs leading-5 text-text-secondary">Organise questions into sections, then preview exactly what the client will see.</p></div><span className="rounded-full bg-[#edf5ef] px-3 py-1.5 text-xs font-semibold text-brand-primary">{sections.length} {sections.length === 1 ? "section" : "sections"} · {questionCount({ sections })} {questionCount({ sections }) === 1 ? "question" : "questions"}</span></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-text-primary">Questionnaire title<input value={title} onChange={(change) => setTitle(change.target.value)} placeholder="e.g. Ada & Tunde’s wedding brief" className="mt-2 block h-10 w-full rounded-lg border border-border-default bg-white px-3 text-xs font-normal outline-none focus:border-brand-primary" /></label><label className="text-xs font-semibold text-text-primary">Event type<select value={category} onChange={(change) => setCategory(change.target.value)} className="mt-2 block h-10 w-full rounded-lg border border-border-default bg-white px-3 text-xs font-normal outline-none focus:border-brand-primary">{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>{category === "Other" && <label className="block text-xs font-semibold text-text-primary">Other event type<input value={otherCategory} onChange={(change) => setOtherCategory(change.target.value)} placeholder="e.g. Product launch" className="mt-2 block h-10 w-full rounded-lg border border-border-default bg-white px-3 text-xs font-normal outline-none focus:border-brand-primary" /></label>}
    {preview ? <div className="rounded-xl border border-border-subtle bg-[#fafafa] p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[0.625rem] font-bold uppercase tracking-wider text-text-tertiary">Client preview</p><h5 className="mt-1 text-base font-semibold">{title.trim() || "Untitled questionnaire"}</h5><p className="mt-1 text-xs text-text-secondary">{category === "Other" ? otherCategory || "Other" : category} · {questionCount({ sections })} questions</p></div><Button type="button" size="sm" variant="outline" onClick={() => setPreview(false)}>Back to editing</Button></div><div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]"><div className="space-y-1">{sections.map((section) => <button key={section.id} type="button" onClick={() => setPreviewSectionId(section.id)} className={cn("block w-full rounded-lg px-3 py-2 text-left text-xs", previewSection?.id === section.id ? "bg-[#eaf3ed] font-semibold text-brand-primary" : "text-text-secondary hover:bg-white")}>{section.title || "Untitled section"}</button>)}</div><div className="space-y-5 rounded-xl border border-border-subtle bg-white p-5"><h6 className="border-b border-border-subtle pb-3 text-sm font-semibold">{previewSection?.title}</h6>{previewSection?.questions.map((question, index) => <QuestionPreview key={question.id} question={question} index={index} />)}</div></div></div> : <div className="space-y-5">{sections.map((section, sectionIndex) => <section key={section.id} className="space-y-4 rounded-xl border border-border-subtle bg-[#fafafa] p-4 sm:p-5"><div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-white p-4"><SectionTitleEditor title={section.title} number={sectionIndex + 1} total={sections.length} onChange={(nextTitle) => updateSection(section.id, { title: nextTitle })} />{sections.length > 1 && <ConfirmDeleteButton confirmationTitle="Delete questionnaire section?" description={`“${section.title || "This section"}” and all its questions will be removed from this draft. This can’t be undone.`} onConfirm={() => setSections((current) => current.filter((item) => item.id !== section.id))} aria-label={`Delete section ${sectionIndex + 1}`} className="flex size-10 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-4" aria-hidden="true" /></ConfirmDeleteButton>}</div>
      {section.questions.map((question, index) => <div key={question.id} className="rounded-xl border border-border-subtle bg-white p-4"><div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[auto_minmax(0,1fr)_140px] sm:gap-3"><span className="pt-3 text-xs text-text-tertiary">{index + 1}.</span><input aria-label={`Question ${index + 1} in ${section.title}`} value={question.label} onChange={(change) => updateQuestion(section.id, question.id, { label: change.target.value })} placeholder={question.type === "divider" ? "Divider label" : "Type your question"} className="h-10 min-w-0 rounded-lg bg-[#f7f8f8] px-3 text-xs outline-none focus:ring-1 focus:ring-brand-primary" /><select aria-label="Question type" value={question.type ?? "short"} onChange={(change) => { const type = change.target.value as QuestionnaireQuestionType; updateQuestion(section.id, question.id, { type, required: type !== "divider", options: needsOptions(type) ? (question.options?.length ? question.options : ["Option 1", "Option 2"]) : undefined }); }} className="col-start-2 h-10 min-w-0 w-full rounded-lg border border-border-subtle bg-white px-2 text-xs outline-none focus:border-brand-primary sm:col-start-3 sm:row-start-1">{questionTypeGroups.flatMap((group) => group.types).map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
        {needsOptions(question.type ?? "short") && <label className="mt-3 block pl-5 text-[0.6875rem] font-medium text-text-secondary">Answer options <span className="font-normal text-text-tertiary">(one per line)</span><textarea value={(question.options ?? []).join("\n")} onChange={(change) => updateQuestion(section.id, question.id, { options: change.target.value.split("\n") })} rows={Math.max(2, question.options?.length ?? 2)} className="mt-1.5 block w-full resize-y rounded-lg border border-border-subtle px-3 py-2 text-xs leading-5 outline-none focus:border-brand-primary" /></label>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3"><label className="flex items-center gap-2 text-[0.6875rem] text-text-secondary"><input type="checkbox" checked={question.required !== false && question.type !== "divider"} disabled={question.type === "divider"} onChange={(change) => updateQuestion(section.id, question.id, { required: change.target.checked })} className="accent-brand-primary" />Required</label><div className="flex items-center gap-1"><button type="button" disabled={index === 0} onClick={() => moveQuestion(section.id, index, -1)} aria-label="Move question up" className="flex size-7 items-center justify-center rounded-md text-text-tertiary hover:bg-background-subtle disabled:opacity-30"><ArrowUp className="size-3.5" /></button><button type="button" disabled={index === section.questions.length - 1} onClick={() => moveQuestion(section.id, index, 1)} aria-label="Move question down" className="flex size-7 items-center justify-center rounded-md text-text-tertiary hover:bg-background-subtle disabled:opacity-30"><ArrowDown className="size-3.5" /></button><button type="button" onClick={() => setSections((current) => current.map((item) => item.id === section.id ? { ...item, questions: [...item.questions.slice(0, index + 1), { ...question, id: crypto.randomUUID() }, ...item.questions.slice(index + 1)] } : item))} aria-label="Duplicate question" className="flex size-7 items-center justify-center rounded-md text-text-tertiary hover:bg-background-subtle"><Copy className="size-3.5" /></button><ConfirmDeleteButton confirmationTitle="Delete question?" description={`“${question.label || "This question"}” will be removed from this draft. This can’t be undone.`} onConfirm={() => removeQuestion(section.id, question.id)} aria-label="Delete question" className="flex size-10 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-4" aria-hidden="true" /></ConfirmDeleteButton></div></div></div>)}
      <div className="rounded-xl border border-dashed border-border-strong bg-white p-4"><p className="text-[0.625rem] font-bold uppercase tracking-wider text-text-tertiary">Add a question</p><div className="mt-3 space-y-3">{questionTypeGroups.map((group) => <div key={group.label} className="grid gap-2 sm:grid-cols-[80px_minmax(0,1fr)]"><span className="pt-1.5 text-[0.6875rem] text-text-tertiary">{group.label}</span><div className="flex flex-wrap gap-1.5">{group.types.map((type) => <button key={type.value} type="button" onClick={() => addQuestion(section.id, type.value)} className="rounded-lg border border-border-subtle bg-white px-2.5 py-1.5 text-[0.6875rem] text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-primary">{type.label}</button>)}</div></div>)}</div></div></section>)}<button type="button" onClick={() => setSections((current) => [...current, freshSection(current.length + 1)])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border-strong bg-white px-4 py-2.5 text-xs font-semibold text-brand-primary hover:border-brand-primary"><Plus className="size-4" aria-hidden="true" />Add section</button></div>}
    {error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}{success && <p role="status" className="rounded-lg bg-success-soft px-3 py-2 text-xs text-success">{success}</p>}<div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle pt-5"><Button type="button" size="sm" variant="outline" onClick={() => { if (valid()) setPreview((value) => !value); }} leadingIcon={<Eye className="size-3.5" aria-hidden="true" />}>{preview ? "Edit questions" : "Preview questionnaire"}</Button><Button type="button" size="sm" onClick={startSend} leadingIcon={props.mode === "template" ? <Check className="size-3.5" aria-hidden="true" /> : <Send className="size-3.5" aria-hidden="true" />}>{props.mode === "template" ? "Save template" : "Send to client"}</Button></div>
    <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.25rem] bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-6"><div className="flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">Send questionnaire</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">Would you like to save this questionnaire as a reusable template too?</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close" className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></div><form onSubmit={send} className="mt-5 space-y-3"><label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3", !saveTemplate ? "border-brand-primary bg-[#f7faf8]" : "border-border-subtle")}><input type="radio" name="save-template" checked={!saveTemplate} onChange={() => setSaveTemplate(false)} className="mt-1 accent-brand-primary" /><span><span className="block text-xs font-semibold">Send only</span><span className="mt-1 block text-[0.6875rem] text-text-secondary">Use this questionnaire for this event.</span></span></label><label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3", saveTemplate ? "border-brand-primary bg-[#f7faf8]" : "border-border-subtle")}><input type="radio" name="save-template" checked={saveTemplate} onChange={() => setSaveTemplate(true)} className="mt-1 accent-brand-primary" /><span><span className="block text-xs font-semibold">Save as template & send</span><span className="mt-1 block text-[0.6875rem] text-text-secondary">Reuse these sections and questions in future events.</span></span></label>{saveTemplate && <label className="block text-xs font-semibold">Template title<input value={templateTitle} onChange={(change) => setTemplateTitle(change.target.value)} placeholder="e.g. Wedding discovery questionnaire" className="mt-2 block h-10 w-full rounded-lg border border-border-default px-3 text-xs font-normal outline-none focus:border-brand-primary" /></label>}{error && <p role="alert" className="text-xs text-error">{error}</p>}<div className="flex justify-end gap-2 pt-3"><Dialog.Close asChild><Button type="button" variant="outline" size="sm">Cancel</Button></Dialog.Close><Button type="submit" size="sm" leadingIcon={<Check className="size-3.5" aria-hidden="true" />}>Send questionnaire</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
