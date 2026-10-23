import type { EventItem, EventNote, PlannerEvent } from "./planner-events";

export type NoteFilter = "all" | "pinned" | "team" | "nimi";
export function noteIsFromNimi(note: EventNote) {
  return note.authorId?.trim().toLocaleLowerCase() === "nimi" || (!note.authorId && note.author.trim().toLocaleLowerCase() === "nimi");
}
export function filterEventNotes(notes: EventNote[], filter: NoteFilter, search = "") {
  const term = search.trim().toLocaleLowerCase();
  return notes.filter((note) => (filter === "all" || filter === "pinned" && note.pinned || filter === "team" && !noteIsFromNimi(note) || filter === "nimi" && noteIsFromNimi(note)) && (!term || `${note.title || ""} ${note.body} ${note.author} ${noteDateLabel(note.createdAt)} ${noteDate(note.createdAt)}`.toLocaleLowerCase().includes(term)));
}

const zone = "Africa/Lagos";
export function noteDay(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("-");
}

export function noteDateLabel(iso: string, now = new Date()) {
  const day = noteDay(iso);
  if (day === "unknown") return "Date unknown";
  if (day === noteDay(now.toISOString())) return "Today";
  if (day === noteDay(new Date(now.getTime() - 86_400_000).toISOString())) return "Yesterday";
  return noteDate(iso);
}

export function noteDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Date unknown" : new Intl.DateTimeFormat("en-GB", { timeZone: zone, day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export function noteTime(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Time unknown" : new Intl.DateTimeFormat("en-NG", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: true }).format(date);
}

export function groupEventNotes(notes: EventNote[], now = new Date()) {
  const sorted = [...notes].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  const pinned = sorted.filter((note) => note.pinned);
  const days = new Map<string, { key: string; label: string; notes: EventNote[] }>();
  for (const note of sorted.filter((entry) => !entry.pinned)) {
    const key = noteDay(note.createdAt);
    if (!days.has(key)) days.set(key, { key, label: noteDateLabel(note.createdAt, now), notes: [] });
    days.get(key)!.notes.push(note);
  }
  return [...(pinned.length ? [{ key: "pinned", label: "Pinned", notes: pinned }] : []), ...days.values()];
}

export function notePlainText(body: string) {
  return body.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1").replace(/\*\*|__|~~|\^\^/g, "").replace(/\*([^*]+)\*/g, "$1");
}

const escape = (text: string) => text.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
function inlineHtml(text: string): string {
  return text.split(/(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\^\^[^^]+\^\^|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g).map((part) => {
    for (const [mark, tag] of [["**", "strong"], ["__", "u"], ["~~", "s"], ["^^", 'span style="color:#3870cf"'], ["*", "em"]]) {
      if (part.startsWith(mark) && part.endsWith(mark) && part.length > mark.length * 2) return `<${tag}>${inlineHtml(part.slice(mark.length, -mark.length))}</${tag.split(" ")[0]}>`;
    }
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(part);
    if (link) {
      try { const url = new URL(link[2]); if (["https:", "http:"].includes(url.protocol)) return `<a href="${escape(url.href)}">${escape(link[1])}</a>`; } catch { /* Keep invalid links as text. */ }
    }
    return escape(part);
  }).join("");
}

/** Rehydrate our stored formatting without injecting stored HTML into the editor. */
export function noteEditorHtml(body: string) {
  let html = "", list = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("- ")) {
      if (!list) { html += "<ul>"; list = true; }
      html += `<li>${inlineHtml(line.slice(2))}</li>`;
    } else {
      if (list) { html += "</ul>"; list = false; }
      html += `<div>${line ? inlineHtml(line) : "<br>"}</div>`;
    }
  }
  return html + (list ? "</ul>" : "");
}

export function createNoteTask(event: PlannerEvent, notes: EventNote[], noteId: string, task: EventItem): PlannerEvent {
  const note = notes.find((entry) => entry.id === noteId);
  if (!note) throw new Error("This note no longer exists.");
  const existing = event.sections.tasks.find((entry) => entry.id === note.taskId || entry.sourceNoteId === note.id);
  const linkedTask = existing || { ...task, sourceNoteId: note.id, status: "todo" as const, done: false, clientVisible: false };
  return { ...event, notes: "", noteEntries: notes.map((entry) => entry.id === noteId ? { ...entry, taskId: linkedTask.id } : entry), sections: { ...event.sections, tasks: existing ? event.sections.tasks : [...event.sections.tasks, linkedTask] } };
}
