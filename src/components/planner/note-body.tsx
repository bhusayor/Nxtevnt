import type { ReactNode } from "react";

function inline(line: string): ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\^\^[^^]+\^\^|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{inline(part.slice(2, -2))}</strong>;
    if (part.startsWith("__") && part.endsWith("__")) return <u key={index}>{inline(part.slice(2, -2))}</u>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <s key={index}>{inline(part.slice(2, -2))}</s>;
    if (part.startsWith("^^") && part.endsWith("^^")) return <span key={index} className="font-medium text-[#3870cf]">{inline(part.slice(2, -2))}</span>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(part);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-primary underline underline-offset-2">{link[1]}</a>;
    return part;
  });
}

export function NoteBody({ body }: { body: string }) {
  return <div className="space-y-1.5 text-[0.8125rem] leading-6 text-text-primary">{body.split("\n").map((line, index) => line.startsWith("- ") ? <div key={index} className="flex gap-2"><span aria-hidden="true">•</span><span className="min-w-0 break-words">{inline(line.slice(2))}</span></div> : line ? <p key={index} className="whitespace-pre-wrap break-words">{inline(line)}</p> : <div key={index} className="h-1" />)}</div>;
}
