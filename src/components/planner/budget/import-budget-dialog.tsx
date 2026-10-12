"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Check, Download, FileSpreadsheet, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { analyseImport, autoMapColumns, budgetTemplateCsv, importFields, readBudgetFile, type BudgetSheet, type ImportCandidate, type ImportField, type ImportMapping } from "@/lib/budget-import";
import type { PlannerEvent } from "@/lib/planner-events";
import { currencies, importBudgetData, type BudgetGroup, type BudgetItem } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

type Stage = "upload" | "sheet" | "mapping" | "preview" | "confirm" | "success";
type DuplicateChoice = "skip" | "update" | "new";
type Result = { added: number; updated: number; groups: number; skipped: number };

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([budgetTemplateCsv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "nxtevnt-budget-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function importPlan(candidates: ImportCandidate[], duplicateChoice: DuplicateChoice, groups: BudgetGroup[], existingItems: BudgetItem[], eventId: string | null, currency: string) {
  const valid = candidates.filter((candidate) => !candidate.errors.length && !candidate.duplicateInFile && (duplicateChoice !== "skip" || !candidate.duplicateId));
  const existing = new Map(groups.filter((group) => group.eventId === eventId && group.currency === currency).map((group) => [group.name.toLowerCase(), group]));
  const newGroups: BudgetGroup[] = [];
  const now = new Date().toISOString();
  const items = valid.map((candidate) => {
    let group = existing.get(candidate.groupName.toLowerCase());
    if (!group) { group = { id: crypto.randomUUID(), name: candidate.groupName, eventId, currency, createdAt: now }; existing.set(candidate.groupName.toLowerCase(), group); newGroups.push(group); }
    const previous = duplicateChoice === "update" && candidate.duplicateId ? existingItems.find((item) => item.id === candidate.duplicateId) : undefined;
    return { ...candidate.item, id: previous?.id ?? candidate.item.id, groupId: group.id, eventId, currency, attachments: previous?.attachments ?? [], installments: previous?.installments ?? [], createdAt: previous?.createdAt ?? candidate.item.createdAt };
  });
  return { groups: newGroups, items, added: valid.filter((candidate) => !(duplicateChoice === "update" && candidate.duplicateId)).length, updated: valid.filter((candidate) => duplicateChoice === "update" && candidate.duplicateId).length, skipped: candidates.length - valid.length };
}

export function ImportBudgetDialog({ open, onOpenChange, events, targetEventId, requireEvent = false, currency, groups, items, onImported }: { open: boolean; onOpenChange: (open: boolean) => void; events: readonly PlannerEvent[]; targetEventId: string | null; requireEvent?: boolean; currency: string; groups: BudgetGroup[]; items: BudgetItem[]; onImported: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<BudgetSheet[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [eventId, setEventId] = useState(targetEventId ?? "");
  const [importCurrency, setImportCurrency] = useState(currency);
  const [duplicateChoice, setDuplicateChoice] = useState<DuplicateChoice>("skip");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const sheet = sheets[sheetIndex];
  const targetId = targetEventId ?? (eventId || null);
  const relevantGroups = groups.filter((group) => group.currency === importCurrency && group.eventId === targetId);
  const relevantGroupIds = new Set(relevantGroups.map((group) => group.id));
  const candidates = sheet && (stage === "preview" || stage === "confirm") ? analyseImport(sheet, mapping, targetId, relevantGroups, items.filter((item) => relevantGroupIds.has(item.groupId))) : [];
  const issues = candidates.filter((candidate) => candidate.errors.length).length;
  const duplicates = candidates.filter((candidate) => candidate.duplicateId || candidate.duplicateInFile).length;
  const plan = importPlan(candidates, duplicateChoice, relevantGroups, items, targetId, importCurrency);

  function reset() { setStage("upload"); setFileName(""); setSheets([]); setSheetIndex(0); setMapping({}); setEventId(targetEventId ?? ""); setImportCurrency(currency); setDuplicateChoice("skip"); setError(""); setResult(null); }
  function changeOpen(next: boolean) { if (!next) reset(); onOpenChange(next); }
  async function acceptFile(file?: File) {
    if (!file) return;
    if (requireEvent && !targetId) { setError("Choose an event before importing a budget."); return; }
    setError("");
    try {
      const parsed = await readBudgetFile(file);
      setFileName(file.name); setSheets(parsed); setSheetIndex(0); setMapping(autoMapColumns(parsed[0].headers));
      setStage(parsed.length > 1 ? "sheet" : "mapping");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "We couldn’t read this spreadsheet."); }
  }
  function chooseFile(change: ChangeEvent<HTMLInputElement>) { void acceptFile(change.target.files?.[0]); change.target.value = ""; }
  function dropFile(event: DragEvent<HTMLDivElement>) { event.preventDefault(); void acceptFile(event.dataTransfer.files[0]); }
  function continueMapping() {
    const chosen = Object.values(mapping).filter((field) => field !== "ignore");
    if (!chosen.includes("group") || !chosen.includes("item")) { setError("Map both Budget Group and Budget Item before continuing."); return; }
    if (new Set(chosen).size !== chosen.length) { setError("Map each Nextevnt field to only one spreadsheet column."); return; }
    setError(""); setStage("preview");
  }
  function confirmImport() {
    if (!plan.items.length) { setError("No valid items are ready to import."); return; }
    try {
      importBudgetData(plan.groups, plan.items);
      setResult({ added: plan.added, updated: plan.updated, groups: plan.groups.length, skipped: plan.skipped });
      setStage("success"); setError(""); onImported();
    } catch { setError("The import couldn’t be saved in this browser. Your file is unchanged; please try again."); }
  }
  function back() { setError(""); setStage(stage === "confirm" ? "preview" : stage === "preview" ? "mapping" : stage === "mapping" && sheets.length > 1 ? "sheet" : "upload"); }
  const eventName = events.find((event) => event.id === targetId)?.name ?? "General / no event";

  return <Dialog.Root open={open} onOpenChange={changeOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(92vh,860px)] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-[var(--shadow-lg)] focus:outline-none"><div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6"><div><Dialog.Title className="text-lg font-semibold tracking-tight">{stage === "success" ? "Budget imported" : "Import budget"}</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">{stage === "upload" ? "Upload an existing spreadsheet and we’ll help you match its columns to Nxtevnt." : stage === "success" ? "Your valid budget items are ready to review." : `${fileName} · Step ${stage === "sheet" ? 1 : stage === "mapping" ? 2 : stage === "preview" ? 3 : 4} of 4`}</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close import" className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></div>
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
      {stage === "upload" && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">{targetEventId === null && <label className="text-xs font-semibold">Event<select value={eventId} onChange={(change) => { setEventId(change.target.value); setError(""); }} className="mt-2 h-10 w-full rounded-lg border border-border-default bg-white px-3 text-xs font-normal"><option value="" disabled={requireEvent}>{requireEvent ? "Choose an event" : "General / no event"}</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>}<label className="text-xs font-semibold">Currency<select value={importCurrency} onChange={(change) => setImportCurrency(change.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border-default bg-white px-3 text-xs font-normal">{currencies.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label></div><div onDragOver={(event) => event.preventDefault()} onDrop={dropFile} className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[#aebfb1] bg-[#f9fbf9] px-5 py-7 text-center"><span className="flex size-10 items-center justify-center rounded-lg bg-white text-brand-primary"><Upload className="size-5" /></span><p className="mt-3 text-sm font-semibold">Drag and drop your file</p><p className="mt-1 text-xs text-text-secondary">or choose a file from your device</p><input ref={fileInput} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={chooseFile} className="sr-only" /><Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => fileInput.current?.click()}>Choose file</Button><p className="mt-3 text-[0.6875rem] text-text-tertiary">CSV, XLSX or XLS · Up to 10 MB</p></div><button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary hover:underline"><Download className="size-4" />Download Nxtevnt budget template</button><p className="text-[0.6875rem] leading-5 text-text-tertiary">Currency is selected explicitly; amounts are not inferred from the numbers in your file.</p></div>}
      {stage === "sheet" && <div><p className="text-sm font-semibold">Choose a sheet</p><p className="mt-1 text-xs text-text-secondary">This workbook has multiple sheets. Choose the one containing your budget items.</p><div className="mt-4 space-y-2">{sheets.map((option, index) => <label key={option.name} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-xs", sheetIndex === index ? "border-[#93b49d] bg-[#f3f8f4]" : "border-border-subtle")}><input type="radio" checked={sheetIndex === index} onChange={() => { setSheetIndex(index); setMapping(autoMapColumns(option.headers)); }} className="accent-brand-primary" /><FileSpreadsheet className="size-4 text-brand-primary" /><span className="flex-1 font-semibold">{option.name}</span><span className="text-text-tertiary">{option.rows.length} rows</span></label>)}</div></div>}
      {stage === "mapping" && sheet && <div><p className="text-sm font-semibold">Match your columns</p><p className="mt-1 text-xs text-text-secondary">Budget Group and Budget Item are required. Budgeted Amount is recommended.</p><div className="mt-4 overflow-hidden rounded-lg border border-border-subtle"><div className="grid grid-cols-2 bg-[#f8faf8] px-4 py-2.5 text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary"><span>Your column</span><span>Nxtevnt field</span></div><div className="max-h-80 divide-y divide-border-subtle overflow-y-auto">{sheet.headers.map((header) => <div key={header} className="grid grid-cols-2 items-center gap-3 px-4 py-2.5 text-xs"><span className="min-w-0 truncate font-medium" title={header}>{header}</span><select aria-label={`Map ${header}`} value={mapping[header] ?? "ignore"} onChange={(change) => { setMapping((current) => ({ ...current, [header]: change.target.value as ImportField | "ignore" })); setError(""); }} className="h-9 min-w-0 rounded-md border border-border-default bg-white px-2 text-xs"><option value="ignore">Don’t import</option>{importFields.map((field) => <option key={field.value} value={field.value}>{field.label}{field.required ? " · Required" : field.recommended ? " · Recommended" : " · Optional"}</option>)}</select></div>)}</div></div></div>}
      {stage === "preview" && <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Review before importing</p><p className="mt-1 text-xs text-text-secondary">{candidates.length} rows reviewed · {candidates.length - issues} without errors · {issues} need attention</p></div>{issues > 0 && <span className="rounded-md bg-[#fcf3e5] px-2 py-1 text-[0.6875rem] font-semibold text-[#8b6637]">Invalid rows will be skipped</span>}</div><div className="overflow-x-auto rounded-lg border border-border-subtle"><table className="w-full min-w-[660px] text-left text-xs"><thead className="bg-[#f8faf8] text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary"><tr>{["Row", "Budget group", "Item", "Vendor", "Budgeted", "Paid", "Status / issue"].map((label) => <th key={label} className="px-3 py-2.5">{label}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{candidates.slice(0, 10).map((candidate) => <tr key={candidate.rowNumber} className={candidate.errors.length ? "bg-[#fff8f6]" : ""}><td className="px-3 py-2.5 text-text-tertiary">{candidate.rowNumber}</td><td className="px-3 py-2.5">{candidate.groupName || "—"}</td><td className="px-3 py-2.5 font-medium">{candidate.item.name || "—"}</td><td className="px-3 py-2.5">{candidate.item.vendor || "—"}</td><td className="px-3 py-2.5 tabular-nums">{candidate.item.budgeted.toLocaleString("en-NG")}</td><td className="px-3 py-2.5 tabular-nums">{candidate.item.paid.toLocaleString("en-NG")}</td><td className={cn("px-3 py-2.5", candidate.errors.length && "font-medium text-error")}>{candidate.errors.join(", ") || (candidate.duplicateId || candidate.duplicateInFile ? "Possible duplicate" : "Ready")}</td></tr>)}</tbody></table></div>{candidates.length > 10 && <p className="text-[0.6875rem] text-text-tertiary">Showing the first 10 of {candidates.length} rows.</p>}{duplicates > 0 && <div className="rounded-lg border border-[#e7e2ef] bg-[#faf8fc] p-4"><p className="text-xs font-semibold">How should duplicates be handled?</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{[{ value: "skip", label: "Skip duplicates" }, { value: "update", label: "Update existing items" }, { value: "new", label: "Import as new items" }].map((choice) => <label key={choice.value} className="inline-flex items-center gap-2 text-xs"><input type="radio" name="duplicates" value={choice.value} checked={duplicateChoice === choice.value} onChange={() => setDuplicateChoice(choice.value as DuplicateChoice)} className="accent-brand-primary" />{choice.label}</label>)}</div><p className="mt-2 text-[0.6875rem] text-text-tertiary">Repeated rows inside the same file are skipped in every mode.</p></div>}</div>}
      {stage === "confirm" && <div className="mx-auto max-w-lg"><p className="text-sm font-semibold">Confirm this import</p><p className="mt-1 text-xs text-text-secondary">Only valid rows will be imported. Existing items change only if you selected “Update existing items”.</p><dl className="mt-5 divide-y divide-border-subtle rounded-lg border border-border-subtle px-4">{[{ label: "Event", value: eventName }, { label: "Currency", value: importCurrency }, { label: "Rows in file", value: String(candidates.length) }, { label: "New groups", value: String(plan.groups.length) }, { label: "New items", value: String(plan.added) }, { label: "Existing items updated", value: String(plan.updated) }, { label: "Rows skipped", value: String(plan.skipped) }].map((row) => <div key={row.label} className="flex items-center justify-between gap-3 py-3 text-xs"><dt className="text-text-secondary">{row.label}</dt><dd className="text-right font-semibold">{row.value}</dd></div>)}</dl></div>}
      {stage === "success" && result && <div className="flex flex-col items-center px-4 py-7 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-[#e8f5ed] text-brand-primary"><Check className="size-6" /></span><h3 className="mt-4 text-lg font-semibold">Budget imported</h3><p className="mt-2 text-xs leading-5 text-text-secondary">{result.added} items added · {result.updated} updated · {result.groups} groups created · {result.skipped} rows skipped</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button type="button" variant="outline" onClick={reset}>Import another file</Button><Button type="button" onClick={() => changeOpen(false)}>View budget</Button></div></div>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}
    </div>
    {stage !== "success" && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-4 sm:px-6"><div>{stage !== "upload" && <button type="button" onClick={back} className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"><ArrowLeft className="size-3.5" />Back</button>}</div><div className="flex gap-2"><Button type="button" size="md" variant="outline" onClick={() => changeOpen(false)}>Cancel</Button>{stage === "sheet" && <Button type="button" size="md" onClick={() => setStage("mapping")}>Continue</Button>}{stage === "mapping" && <Button type="button" size="md" onClick={continueMapping}>Preview rows</Button>}{stage === "preview" && <Button type="button" size="md" disabled={!plan.items.length} onClick={() => { setError(""); setStage("confirm"); }}>{issues ? "Import valid rows only" : "Continue"}</Button>}{stage === "confirm" && <Button type="button" size="md" disabled={!plan.items.length} onClick={confirmImport}>Import {plan.items.length} {plan.items.length === 1 ? "item" : "items"}</Button>}</div></div>}
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
