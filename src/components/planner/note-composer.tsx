"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Bold, Italic, Link2, List, Microphone, Pencil, Send, Smile, Strikethrough, Underline } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { noteEditorHtml, noteTitleFromBody } from "@/lib/event-notes";
import type { EventNote } from "@/lib/planner-events";

type VoiceResult = { isFinal: boolean; 0: { transcript: string } };
type VoiceRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<VoiceResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type VoiceWindow = Window & { SpeechRecognition?: new () => VoiceRecognition; webkitSpeechRecognition?: new () => VoiceRecognition };

function textFromNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";
  const tag = node.tagName.toLowerCase();
  if (tag === "script" || tag === "style") return "";
  if (tag === "br") return "\n";
  const inside = Array.from(node.childNodes).map(textFromNode).join("");
  if (tag === "strong" || tag === "b") return `**${inside}**`;
  if (tag === "em" || tag === "i") return `*${inside}*`;
  if (tag === "u") return `__${inside}__`;
  if (tag === "s" || tag === "strike" || tag === "del") return `~~${inside}~~`;
  if (tag === "a") {
    try { const url = new URL(node.getAttribute("href") ?? ""); if (["http:", "https:"].includes(url.protocol)) return `[${inside}](${url.toString()})`; }
    catch { /* Treat unsafe or incomplete links as text. */ }
    return inside;
  }
  if (tag === "font" || tag === "span") {
    const colour = tag === "font" ? node.getAttribute("color") : node.style.color;
    let formatted = inside;
    if (node.style.fontWeight === "bold" || Number(node.style.fontWeight) >= 600) formatted = `**${formatted}**`;
    if (node.style.fontStyle === "italic") formatted = `*${formatted}*`;
    if (node.style.textDecoration.includes("underline")) formatted = `__${formatted}__`;
    if (node.style.textDecoration.includes("line-through")) formatted = `~~${formatted}~~`;
    return colour ? `^^${formatted}^^` : formatted;
  }
  if (tag === "li") return `- ${inside.trim()}\n`;
  if (tag === "ul" || tag === "ol") return `${inside.trimEnd()}\n`;
  if (tag === "p" || tag === "div") return inside.endsWith("\n") ? inside : `${inside}\n`;
  return inside;
}

export function InlineNoteComposer({ onSave, initialNote, onCancel, autoFocus = false }: { onSave: (note: { title: string; body: string }) => boolean; initialNote?: EventNote; onCancel?: () => void; autoFocus?: boolean }) {
  const titleId = useId();
  const editor = useRef<HTMLDivElement>(null);
  const recognition = useRef<VoiceRecognition | null>(null);
  const linkRange = useRef<Range | null>(null);
  const [title, setTitle] = useState(initialNote?.title || "");
  const [hasContent, setHasContent] = useState(Boolean(initialNote?.body.trim()));
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "starting" | "listening" | "stopping">("idle");
  useEffect(() => () => { const active = recognition.current; recognition.current = null; active?.abort(); }, []);
  const attachEditor = useCallback((node: HTMLDivElement | null) => {
    editor.current = node;
    if (node) node.innerHTML = initialNote?.body ? noteEditorHtml(initialNote.body) : "";
  }, [initialNote?.body]);

  function format(command: string, value?: string) {
    editor.current?.focus();
    document.execCommand(command, false, value);
    setHasContent(Boolean(editor.current?.innerText.trim()));
  }

  function openLink() {
    const selection = window.getSelection();
    linkRange.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    setLinkText(selection?.toString() ?? "");
    setLinkUrl("");
    setLinkOpen(true);
    setEmojiOpen(false);
  }

  function insertLink() {
    try {
      const url = new URL(linkUrl);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error();
      const selection = window.getSelection();
      const range = linkRange.current;
      if (!selection || !range || !editor.current?.contains(range.commonAncestorContainer)) throw new Error();
      selection.removeAllRanges();
      selection.addRange(range);
      const anchor = document.createElement("a");
      anchor.href = url.toString();
      anchor.textContent = linkText.trim() || url.hostname;
      range.deleteContents();
      range.insertNode(anchor);
      range.setStartAfter(anchor);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      setLinkOpen(false);
      setError("");
      setHasContent(true);
      editor.current.focus();
    } catch { setError("Select text and add a valid http:// or https:// link."); }
  }

  function toggleVoice() {
    if (recognition.current) {
      setVoiceStatus("stopping");
      try { recognition.current.stop(); } catch { recognition.current.abort(); recognition.current = null; setVoiceStatus("idle"); }
      return;
    }
    const Voice = (window as VoiceWindow).SpeechRecognition ?? (window as VoiceWindow).webkitSpeechRecognition;
    if (!Voice) { setError("Voice transcription is not supported in this browser. You can still type your note."); return; }
    const active = new Voice();
    const committed = new Set<number>();
    active.lang = "en-NG";
    active.continuous = true;
    active.interimResults = false;
    active.onstart = () => { if (recognition.current === active) setVoiceStatus("listening"); };
    active.onresult = (event) => {
      if (recognition.current !== active || !editor.current) return;
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (!result?.isFinal || committed.has(index)) continue;
        const transcript = result[0]?.transcript.trim();
        if (!transcript) continue;
        committed.add(index);
        const line = document.createElement("div");
        line.textContent = transcript;
        editor.current.appendChild(line);
        setHasContent(true);
        setError("");
      }
    };
    active.onerror = (event) => {
      if (recognition.current !== active) return;
      const message = event.error === "not-allowed" || event.error === "service-not-allowed" ? "Microphone access was denied. Allow it in your browser to record a voice note." : event.error === "audio-capture" ? "No microphone was found. Check your audio device and try again." : event.error === "no-speech" ? "No speech was heard. Try again when you’re ready." : "Voice transcription stopped. Try again or type your note.";
      setError(message);
      recognition.current = null;
      setVoiceStatus("idle");
    };
    active.onend = () => { if (recognition.current === active) { recognition.current = null; setVoiceStatus("idle"); } };
    recognition.current = active;
    setVoiceStatus("starting");
    setError("");
    try { active.start(); }
    catch { recognition.current = null; setVoiceStatus("idle"); setError("Voice transcription could not start. Please try again."); }
  }

  function post(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (voiceStatus !== "idle") { setError("Stop the voice note before saving so the last words can be transcribed."); return; }
    const body = Array.from(editor.current?.childNodes ?? []).map(textFromNode).join("").trim();
    if (!body) { setError("Write a note before posting."); return; }
    if (title.trim().length > 120 || body.length > 20_000) { setError("Keep the title within 120 characters and the note within 20,000 characters."); return; }
    if (onSave({ body, title: title.trim() || noteTitleFromBody(body) || "Untitled note" })) {
      if (editor.current) editor.current.innerHTML = "";
      setHasContent(false); setLinkOpen(false); setEmojiOpen(false); setError("");
      setTitle("");
    } else setError("Your note couldn’t be saved in this browser. Please try again.");
  }

  return <section aria-label={initialNote ? "Edit note inline" : "Capture a thought"} className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[0_8px_28px_-24px_rgba(20,45,30,.25)]"><header className="flex items-center gap-3 px-5 pt-5 sm:px-6"><span className="flex size-9 items-center justify-center rounded-xl bg-[#fbf2e7] text-[#a4671c]"><Pencil className="size-4" aria-hidden="true" /></span><h3 className="text-sm font-semibold">{initialNote ? "Edit note" : "Capture a thought"}</h3></header>
    <form onSubmit={post} className="flex flex-col"><div className="px-5 pb-1 pt-4 sm:px-6"><label htmlFor={titleId} className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-text-secondary"><span>Title or subject</span><span className="font-normal text-text-tertiary">Optional</span></label><input id={titleId} autoFocus={autoFocus} maxLength={120} placeholder="e.g. Venue walkthrough updates" value={title} onChange={(change) => setTitle(change.target.value)} className="h-11 w-full min-w-0 rounded-lg border border-border-default bg-white px-3 text-sm font-medium outline-none placeholder:font-normal placeholder:text-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" /></div>
      <div className="relative min-h-40"><div ref={attachEditor} contentEditable role="textbox" aria-label="Note message" aria-multiline="true" suppressContentEditableWarning onInput={(event) => { setHasContent(Boolean(event.currentTarget.innerText.trim())); setError(""); }} onPaste={(event) => { event.preventDefault(); format("insertText", event.clipboardData.getData("text/plain")); }} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.closest("form")?.requestSubmit(); } }} className="relative min-h-40 w-full px-5 py-5 text-sm leading-7 text-text-primary outline-none sm:px-6 [&_a]:font-medium [&_a]:text-brand-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5" />{!hasContent && <span aria-hidden="true" className="pointer-events-none absolute left-5 top-5 text-sm text-text-tertiary sm:left-6">What would you like the team to remember?</span>}</div>
      <div className="flex flex-wrap items-center gap-1 border-b border-border-subtle bg-[#fcfdfc] px-4 py-2 sm:px-5" aria-label="Note formatting tools"><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("bold")} title="Bold" aria-label="Bold" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf3ef]"><Bold className="size-4" /></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("italic")} title="Italic" aria-label="Italic" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf3ef]"><Italic className="size-4" /></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("underline")} title="Underline" aria-label="Underline" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf3ef]"><Underline className="size-4" /></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("foreColor", "#3870cf")} title="Blue text" aria-label="Blue text" className="flex size-9 items-center justify-center rounded-lg text-[#3870cf] hover:bg-[#edf3ef]"><span className="text-sm font-bold underline decoration-2 underline-offset-2">A</span></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("insertUnorderedList")} title="Bulleted list" aria-label="Bulleted list" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf3ef]"><List className="size-4" /></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("strikeThrough")} title="Strikethrough" aria-label="Strikethrough" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf3ef]"><Strikethrough className="size-4" /></button><span className="mx-1 h-5 w-px bg-border-subtle" /><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={openLink} title="Add link" aria-label="Add link" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf3ef]"><Link2 className="size-4" /></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setEmojiOpen((value) => !value); setLinkOpen(false); }} title="Add emoji" aria-label="Add emoji" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf3ef]"><Smile className="size-4" /></button></div>
      {linkOpen && <div className="flex flex-wrap items-end gap-2 border-b border-border-subtle bg-[#f7faf8] px-5 py-3"><label className="min-w-32 flex-1 text-[0.6875rem] font-semibold text-text-secondary">Link text<input value={linkText} onChange={(change) => setLinkText(change.target.value)} className="mt-1 block h-9 w-full rounded-lg border border-border-default bg-white px-3 text-xs outline-none focus:border-brand-primary" /></label><label className="min-w-44 flex-[2] text-[0.6875rem] font-semibold text-text-secondary">URL<input type="url" value={linkUrl} onChange={(change) => setLinkUrl(change.target.value)} placeholder="https://…" className="mt-1 block h-9 w-full rounded-lg border border-border-default bg-white px-3 text-xs outline-none focus:border-brand-primary" /></label><button type="button" onClick={insertLink} className="h-9 rounded-lg bg-brand-primary bg-[image:var(--action-primary-gradient)] hover:bg-[image:var(--action-primary-gradient-hover)] active:bg-[image:var(--action-primary-gradient-active)] px-3 text-xs font-semibold text-white">Add link</button><button type="button" onClick={() => setLinkOpen(false)} className="h-9 px-2 text-xs font-semibold text-text-secondary">Cancel</button></div>}
      {emojiOpen && <div className="flex gap-1 border-b border-border-subtle bg-[#f7faf8] px-5 py-2" aria-label="Choose an emoji">{["✨", "🎉", "✅", "📌", "❤️", "💡"].map((emoji) => <button key={emoji} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { format("insertText", emoji); setEmojiOpen(false); }} aria-label={`Insert ${emoji}`} className="flex size-9 items-center justify-center rounded-lg text-lg hover:bg-white">{emoji}</button>)}</div>}
      {error && <p role="alert" className="mx-5 mt-3 rounded-lg bg-error-soft px-3 py-2 text-xs text-error sm:mx-6">{error}</p>}<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"><p role="status" className="text-xs leading-5 text-text-tertiary">{voiceStatus === "listening" ? "Listening… Stop to finish. Your browser may process audio online." : voiceStatus === "starting" ? "Starting microphone…" : voiceStatus === "stopping" ? "Finishing transcription…" : "Only your team · Ctrl / ⌘ + Enter to save"}</p><div className="flex items-center gap-2">{onCancel && <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel edit</Button>}<button type="button" onClick={toggleVoice} disabled={voiceStatus === "stopping"} aria-label={voiceStatus === "idle" ? "Start voice note" : "Stop voice note"} aria-pressed={voiceStatus !== "idle"} title="Transcribe a voice note. Your browser may process audio online." className={`flex size-9 items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary ${voiceStatus === "idle" ? "border-border-default text-text-secondary hover:border-brand-primary hover:text-brand-primary" : "border-error bg-error-soft text-error"}`}><Microphone className="size-4" aria-hidden="true" /></button><Button type="submit" size="sm" leadingIcon={<Send className="size-3.5" aria-hidden="true" />} disabled={!hasContent || voiceStatus !== "idle"}>{initialNote ? "Save changes" : "Add note"}</Button></div></div></form></section>;
}
