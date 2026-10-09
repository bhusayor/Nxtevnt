"use client";

import { useSyncExternalStore } from "react";
import type { QuestionnaireQuestion, QuestionnaireQuestionType, QuestionnaireSection } from "@/lib/planner-events";

export type QuestionnaireTemplate = {
  id: string;
  title: string;
  category: string;
  sections: QuestionnaireSection[];
  custom?: boolean;
};

export const questionTypeGroups: { label: string; types: { value: QuestionnaireQuestionType; label: string }[] }[] = [
  { label: "Text", types: [{ value: "short", label: "Short answer" }, { value: "long", label: "Long answer" }, { value: "email", label: "Email" }, { value: "phone", label: "Phone" }, { value: "number", label: "Number" }] },
  { label: "Choice", types: [{ value: "single", label: "Single choice" }, { value: "multiple", label: "Multiple choice" }, { value: "dropdown", label: "Dropdown" }, { value: "checkbox", label: "Checkbox" }, { value: "yes-no", label: "Yes / no" }] },
  { label: "Date & time", types: [{ value: "date", label: "Date" }, { value: "time", label: "Time" }, { value: "datetime", label: "Date & time" }, { value: "date-range", label: "Date range" }] },
  { label: "Other", types: [{ value: "photo", label: "Photo upload" }, { value: "file", label: "File upload" }, { value: "divider", label: "Divider" }] },
];

export function needsOptions(type: QuestionnaireQuestionType) {
  return type === "single" || type === "multiple" || type === "dropdown";
}

export function questionRequiresAnswer(question: QuestionnaireQuestion) {
  return question.type !== "divider" && question.required !== false;
}

export function answerIsPresent(value: string | undefined) {
  if (!value?.trim()) return false;
  if (value === "[]") return false;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.length > 0;
    if (typeof parsed === "object" && parsed !== null && "start" in parsed && "end" in parsed) return Boolean(parsed.start && parsed.end);
  } catch { /* Plain-text answers are valid. */ }
  return true;
}

export function displayAnswer(value: string | undefined) {
  if (!answerIsPresent(value)) return "Not answered";
  try {
    const parsed: unknown = JSON.parse(value!);
    if (Array.isArray(parsed)) return parsed.join(", ");
    if (typeof parsed === "object" && parsed !== null && "start" in parsed && "end" in parsed) return `${parsed.start} – ${parsed.end}`;
    if (typeof parsed === "object" && parsed !== null && "name" in parsed) return String(parsed.name);
  } catch { /* Return plain text. */ }
  return value!;
}

function template(id: string, title: string, category: string, groups: [string, string[]][]): QuestionnaireTemplate {
  return { id, title, category, sections: groups.map(([heading, questions], sectionIndex) => ({
    id: `${id}-section-${sectionIndex + 1}`,
    title: heading,
    questions: questions.map((label, questionIndex) => ({ id: `${id}-question-${sectionIndex + 1}-${questionIndex + 1}`, label })),
  })) };
}

export const starterTemplates: readonly QuestionnaireTemplate[] = [
  template("wedding", "Wedding Questionnaire", "wedding", [
    ["Couple details", ["Full names of the couple", "Email address", "Contact number(s)", "Wedding date or preferred date range", "Wedding location (city, state, country)", "Are you having a destination or local wedding?", "Do you have a wedding hashtag?", "Do you have a wedding logo?", "How would you describe your relationship?", "Who is the main planning contact?"]],
    ["Ceremony & traditions", ["What type of ceremony are you planning?", "Where will the ceremony take place?", "What time should the ceremony begin?", "Are there religious or cultural traditions to include?", "Who will officiate?", "Are there any family expectations we should know?"]],
    ["Style & inspiration", ["How do you want the day to feel?", "What colours do you love?", "Are there colours or styles to avoid?", "Share any inspiration links", "What floral style do you prefer?", "What are your three most important details?"]],
    ["Wedding party & logistics", ["How many guests are you expecting?", "How many people are in the wedding party?", "Will guests need transportation?", "Will you need accommodation recommendations?", "Are there accessibility needs to plan for?"]],
    ["Media, music & moments", ["Do you have a photographer or videographer?", "What music should we include?", "Are there songs we should avoid?", "Which moments must be captured?", "Will there be speeches or special performances?"]],
  ]),
  template("corporate", "Corporate Questionnaire", "corporate", [
    ["Event brief", ["Organisation name", "Primary contact and email", "Event name and purpose", "Preferred date and time"]],
    ["Audience", ["Who is attending?", "Expected attendance", "Are there VIP guests?", "Any accessibility requirements?"]],
    ["Venue & format", ["Preferred location", "In-person, virtual or hybrid?", "What room layout do you need?", "Will you need travel or accommodation?"]],
    ["Programme", ["What are the key sessions or activities?", "Who are the speakers?", "Will there be entertainment?", "What technology or AV is needed?"]],
    ["Brand & budget", ["What brand assets should we use?", "Do you have a working budget?", "Who approves final decisions?"]],
  ]),
  template("party", "Party Questionnaire", "party", [
    ["The occasion", ["What are we celebrating?", "Who is the guest of honour?", "Preferred date", "Preferred start and end time", "Who is the main contact?"]],
    ["Guests", ["Expected guest count", "What age groups will attend?", "Any dietary requirements?", "Any accessibility needs?"]],
    ["Look & feel", ["What theme do you have in mind?", "Favourite colours", "Any inspiration links?", "What should guests remember most?"]],
    ["Venue & food", ["Do you have a venue?", "Indoor or outdoor?", "What catering style do you prefer?", "Will there be a bar?"]],
    ["Entertainment & budget", ["What music or entertainment would you like?", "Will there be speeches or activities?", "Do you need photo or video coverage?", "What is your working budget?", "Any must-haves or deal-breakers?"]],
  ]),
  template("wedding-planning", "Wedding Planning Questionnaire", "wedding", [
    ["Planning priorities", ["What are your top three priorities?", "Which decisions are already final?", "What feels most stressful right now?"]],
    ["People & communication", ["Who is involved in planning?", "Who signs off on major decisions?", "How often would you like updates?"]],
    ["Budget", ["What is your estimated total budget?", "Which items matter most?", "Are there family contributions to account for?"]],
    ["Suppliers", ["Which vendors have you booked?", "Which vendors are still needed?", "Are there preferred vendors to contact?"]],
    ["The day", ["What is your preferred timeline?", "Are there cultural or religious moments to schedule?", "What should the day feel like for your guests?"]],
  ]),
];

const storageKey = "nxtevnt.planner.questionnaire-templates.v1";
const changed = "nxtevnt:questionnaire-templates-changed";
const empty: readonly QuestionnaireTemplate[] = [];
let cachedRaw: string | null | undefined;
let cachedCustom: readonly QuestionnaireTemplate[] = empty;

function readCustom(): readonly QuestionnaireTemplate[] {
  if (typeof window === "undefined") return empty;
  let raw: string | null;
  try { raw = window.localStorage.getItem(storageKey); } catch { return empty; }
  if (raw === cachedRaw) return cachedCustom;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedCustom = Array.isArray(parsed) ? parsed.filter((item): item is QuestionnaireTemplate =>
      typeof item === "object" && item !== null && typeof item.id === "string" && typeof item.title === "string" && Array.isArray(item.sections),
    ) : empty;
  } catch { cachedCustom = empty; }
  return cachedCustom;
}

function subscribe(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", callback); };
}

export function useQuestionnaireTemplates() {
  return useSyncExternalStore(subscribe, readCustom, () => empty);
}

function writeCustom(templates: readonly QuestionnaireTemplate[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(templates));
  cachedRaw = undefined;
  window.dispatchEvent(new Event(changed));
}

export function saveQuestionnaireTemplate(input: Omit<QuestionnaireTemplate, "id" | "custom">) {
  const created: QuestionnaireTemplate = { ...input, id: crypto.randomUUID(), custom: true };
  writeCustom([...readCustom(), created]);
  return created;
}

export function deleteQuestionnaireTemplate(id: string) {
  writeCustom(readCustom().filter((item) => item.id !== id));
}

export function questionCount(template: Pick<QuestionnaireTemplate, "sections">) {
  return template.sections.reduce((total, section) => total + section.questions.filter((question) => question.type !== "divider").length, 0);
}
