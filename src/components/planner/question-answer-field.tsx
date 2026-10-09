"use client";

import { useState, type ChangeEvent } from "react";
import type { QuestionnaireQuestion } from "@/lib/planner-events";

const fieldClass = "block w-full rounded-lg border border-border-default bg-white px-3.5 py-3 text-xs leading-5 outline-none transition-colors placeholder:text-text-tertiary focus:border-brand-primary disabled:bg-background-subtle";

function parseList(value: string) {
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; }
  catch { return []; }
}

function parseRange(value: string) {
  try { const parsed: unknown = JSON.parse(value); return typeof parsed === "object" && parsed !== null && "start" in parsed && "end" in parsed ? { start: String(parsed.start ?? ""), end: String(parsed.end ?? "") } : { start: "", end: "" }; }
  catch { return { start: "", end: "" }; }
}

function parseFile(value: string) {
  try { const parsed: unknown = JSON.parse(value); return typeof parsed === "object" && parsed !== null && "name" in parsed && "data" in parsed && typeof parsed.name === "string" && typeof parsed.data === "string" ? { name: parsed.name, data: parsed.data } : null; }
  catch { return null; }
}

export function QuestionAnswerField({ question, value, onChange, disabled }: { question: QuestionnaireQuestion; value: string; onChange: (value: string) => void; disabled: boolean }) {
  const type = question.type ?? "short";
  const [fileError, setFileError] = useState("");
  const id = `answer-${question.id}`;
  if (type === "divider") return null;

  if (type === "long") return <textarea id={id} rows={4} value={value} onChange={(change) => onChange(change.target.value)} disabled={disabled} placeholder="Your answer" className={`${fieldClass} resize-y`} />;
  if (type === "single" || type === "yes-no") return <div className="space-y-2">{(type === "yes-no" ? ["Yes", "No"] : question.options ?? []).map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-subtle px-3 py-2.5 text-xs text-text-secondary"><input type="radio" name={id} checked={value === option} onChange={() => onChange(option)} disabled={disabled} className="accent-brand-primary" />{option}</label>)}</div>;
  if (type === "multiple") {
    const selected = parseList(value);
    return <div className="space-y-2">{(question.options ?? []).map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-subtle px-3 py-2.5 text-xs text-text-secondary"><input type="checkbox" checked={selected.includes(option)} onChange={(change) => onChange(JSON.stringify(change.target.checked ? [...selected, option] : selected.filter((item) => item !== option)))} disabled={disabled} className="accent-brand-primary" />{option}</label>)}</div>;
  }
  if (type === "dropdown") return <select id={id} value={value} onChange={(change) => onChange(change.target.value)} disabled={disabled} className={fieldClass}><option value="">Choose an option</option>{(question.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (type === "checkbox") return <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-subtle px-3 py-3 text-xs text-text-secondary"><input type="checkbox" checked={value === "Yes"} onChange={(change) => onChange(change.target.checked ? "Yes" : "")} disabled={disabled} className="accent-brand-primary" />Yes, I agree</label>;
  if (type === "date-range") {
    const range = parseRange(value);
    return <div className="grid gap-2 sm:grid-cols-2"><label className="text-[0.6875rem] text-text-secondary">Start date<input type="date" value={range.start} onChange={(change) => onChange(JSON.stringify({ ...range, start: change.target.value }))} disabled={disabled} className={`${fieldClass} mt-1`} /></label><label className="text-[0.6875rem] text-text-secondary">End date<input type="date" value={range.end} min={range.start} onChange={(change) => onChange(JSON.stringify({ ...range, end: change.target.value }))} disabled={disabled} className={`${fieldClass} mt-1`} /></label></div>;
  }
  if (type === "photo" || type === "file") {
    const current = parseFile(value);
    async function upload(change: ChangeEvent<HTMLInputElement>) {
      const file = change.target.files?.[0];
      if (!file) return;
      if (file.size > 400 * 1024) { setFileError("Choose a file smaller than 400 KB for this browser-local preview."); return; }
      if (type === "photo" && !file.type.startsWith("image/")) { setFileError("Choose an image file."); return; }
      try {
        const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error()); reader.readAsDataURL(file); });
        onChange(JSON.stringify({ name: file.name, data })); setFileError("");
      } catch { setFileError("This file couldn’t be added."); }
    }
    return <div className="space-y-2">{current ? <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-[#f7faf8] px-3 py-2.5 text-xs"><span className="min-w-0 flex-1 truncate font-medium">{current.name}</span><a href={current.data} download={current.name} className="font-semibold text-brand-primary hover:underline">Download</a>{!disabled && <button type="button" onClick={() => onChange("")} className="font-semibold text-error">Remove</button>}</div> : null}{!disabled && <label className="block cursor-pointer rounded-lg border border-dashed border-border-strong px-4 py-4 text-center text-xs text-text-secondary hover:border-brand-primary">{type === "photo" ? "Add a photo" : "Add a file"} <span className="block text-[0.625rem] text-text-tertiary">Up to 400 KB in this local preview</span><input type="file" accept={type === "photo" ? "image/*" : undefined} onChange={upload} className="sr-only" /></label>}{fileError && <p role="alert" className="text-xs text-error">{fileError}</p>}</div>;
  }
  const inputType = type === "email" ? "email" : type === "phone" ? "tel" : type === "number" ? "number" : type === "date" ? "date" : type === "time" ? "time" : type === "datetime" ? "datetime-local" : "text";
  return <input id={id} type={inputType} value={value} onChange={(change) => onChange(change.target.value)} disabled={disabled} placeholder="Your answer" className={fieldClass} />;
}
