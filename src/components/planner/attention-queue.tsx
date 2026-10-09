"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCheck, ClipboardCheck, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlannerEvents } from "@/lib/planner-events";

export function AttentionQueue() {
  const events = usePlannerEvents();
  const [tasksOnly, setTasksOnly] = useState(false);
  const tasks = events.flatMap((event) => event.sections.tasks.filter((task) => !task.done).map((task) => ({ id: task.id, title: task.title, context: event.name, href: `/planner/events/${event.id}?section=tasks`, type: "task" as const })));
  const decisions = events.flatMap((event) => event.sections.decisions.filter((decision) => !decision.done).map((decision) => ({ id: decision.id, title: decision.title, context: event.name, href: `/planner/events/${event.id}?section=decisions`, type: "decision" as const })));
  const visible = tasksOnly ? tasks : [...tasks, ...decisions];
  const hasAnyItems = events.some((event) => event.sections.tasks.length || event.sections.decisions.length);

  return <section className="overflow-hidden rounded-xl border border-border-subtle bg-white" aria-labelledby="attention-title">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4"><div className="flex items-center gap-2"><h2 id="attention-title" className="text-base font-semibold tracking-[-0.02em] text-text-primary">Needs your attention</h2>{hasAnyItems && <span className="flex size-5 items-center justify-center rounded-full bg-[#f3eff8] text-[0.625rem] font-semibold text-[#705987]">{visible.length}</span>}</div>{hasAnyItems && <div className="flex items-center rounded-lg bg-background p-1" aria-label="Filter attention items"><Button size="xs" variant={tasksOnly ? "ghost" : "outline"} aria-pressed={!tasksOnly} onClick={() => setTasksOnly(false)}>All</Button><Button size="xs" variant={tasksOnly ? "outline" : "ghost"} aria-pressed={tasksOnly} onClick={() => setTasksOnly(true)}>Tasks</Button></div>}</div>
    {visible.length ? <div className="divide-y divide-border-subtle px-5">{visible.slice(0, 5).map((item) => { const Icon = item.type === "task" ? ClipboardCheck : Scale; return <div key={item.id} className="group grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-4 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto]"><span className={`flex size-9 items-center justify-center rounded-lg ${item.type === "task" ? "bg-[#f1eef9] text-[#705987]" : "bg-[#faf1e5] text-[#8a6537]"}`}><Icon className="size-[18px]" aria-hidden="true" /></span><div className="min-w-0"><p className="text-[0.8125rem] font-semibold text-text-primary">{item.title}</p><p className="mt-1 text-[0.6875rem] text-text-secondary">{item.context} · {item.type === "task" ? "Task" : "Decision"}</p></div><Link href={item.href} className="col-start-2 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-brand-primary hover:underline sm:col-start-auto">Open<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></div>; })}</div> : <div className="flex items-start gap-3 px-5 py-7"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf3ed] text-brand-primary"><CheckCheck className="size-[18px]" aria-hidden="true" /></span><div><p className="text-sm font-semibold">{hasAnyItems ? tasksOnly ? "No open tasks" : "All caught up" : "Nothing needs your attention yet"}</p><p className="mt-1 text-xs leading-5 text-text-secondary">{hasAnyItems ? "There’s nothing to follow up on right now." : "Add a task or decision to an event and it will show up here."}</p>{!hasAnyItems && events[0] && <Link href={`/planner/events/${events[0].id}?section=tasks`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">Add a task <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>}</div></div>}
  </section>;
}
