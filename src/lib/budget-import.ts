import type { BudgetGroup, BudgetItem, BudgetStatus, VendorStatus } from "@/lib/planner-budget";
import { budgetDuplicateKey, budgetGroupNames, budgetStatuses } from "@/lib/planner-budget";

export type ImportField = "group" | "item" | "vendor" | "vendorStatus" | "budgeted" | "invoiced" | "paid" | "status" | "paymentDate" | "notes";
export type ImportMapping = Record<string, ImportField | "ignore">;
export type BudgetSheet = { name: string; headers: string[]; rows: string[][] };
export type ImportCandidate = { rowNumber: number; groupName: string; item: BudgetItem; errors: string[]; duplicateId?: string; duplicateInFile?: boolean };

export const importFields: { value: ImportField; label: string; required?: boolean; recommended?: boolean }[] = [
  { value: "group", label: "Budget Group", required: true },
  { value: "item", label: "Budget Item", required: true },
  { value: "vendor", label: "Vendor" },
  { value: "vendorStatus", label: "Vendor status" },
  { value: "budgeted", label: "Budgeted Amount", recommended: true },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
  { value: "status", label: "Payment status" },
  { value: "paymentDate", label: "Payment Date" },
  { value: "notes", label: "Notes" },
];

const aliases: Record<ImportField, string[]> = {
  group: ["group", "budget group", "category", "cost category"],
  item: ["item", "budget item", "description", "expense", "service"],
  vendor: ["vendor", "supplier", "provider"],
  vendorStatus: ["vendor status", "booking status", "vendor booking"],
  budgeted: ["budgeted", "budgeted amount", "planned cost", "estimated cost", "budget"],
  invoiced: ["invoiced", "invoice amount", "amount invoiced", "invoice"],
  paid: ["paid", "amount paid", "payment made"],
  status: ["status", "payment status", "item status"],
  paymentDate: ["payment date", "due date", "expected payment date", "date due"],
  notes: ["notes", "comments", "remarks"],
};

export function autoMapColumns(headers: string[]): ImportMapping {
  const used = new Set<ImportField>();
  return Object.fromEntries(headers.map((header) => {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const field = importFields.find((candidate) => !used.has(candidate.value) && aliases[candidate.value].includes(normalized))?.value ?? "ignore";
    if (field !== "ignore") used.add(field);
    return [header, field];
  }));
}

export async function readBudgetFile(file: File): Promise<BudgetSheet[]> {
  if (!/\.(csv|xlsx|xls)$/i.test(file.name)) throw new Error("Choose a CSV, XLSX or XLS file.");
  const limit = /\.csv$/i.test(file.name) ? 5 : 10;
  if (file.size > limit * 1024 * 1024) throw new Error(`This file is too large. Choose a ${/\.csv$/i.test(file.name) ? "CSV" : "spreadsheet"} of ${limit} MB or less.`);
  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheets = workbook.SheetNames.map((name) => {
      const all = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, defval: "", raw: false, blankrows: false })
        .map((row) => row.map((cell) => String(cell ?? "").trim()));
      const headerIndex = all.findIndex((row) => row.some(Boolean));
      if (headerIndex < 0) return { name, headers: [], rows: [] };
      const usedHeaders = new Set<string>();
      const headers = all[headerIndex].map((heading, index) => {
        const base = heading || `Column ${index + 1}`;
        let unique = base;
        let suffix = 2;
        while (usedHeaders.has(unique.toLowerCase())) unique = `${base} (${suffix++})`;
        usedHeaders.add(unique.toLowerCase());
        return unique;
      });
      const rows = all.slice(headerIndex + 1).filter((row) => row.some(Boolean));
      if (rows.length > 10_000) throw new Error("This spreadsheet has more than 10,000 rows. Split it into smaller files before importing.");
      return { name, headers, rows };
    }).filter((sheet) => sheet.headers.length && sheet.rows.length);
    if (!sheets.length) throw new Error("No budget items were found in this file.");
    return sheets;
  } catch (error) {
    if (error instanceof Error && ["No budget items were found in this file.", "This spreadsheet has more than 10,000 rows. Split it into smaller files before importing."].includes(error.message)) throw error;
    throw new Error("We couldn’t read this spreadsheet. Try saving it again as CSV or XLSX.");
  }
}

function parseAmount(raw: string) {
  if (!raw.trim()) return { value: 0, valid: true };
  const cleaned = raw.replace(/\b(NGN|USD|GBP|EUR)\b/gi, "").replace(/[₦$£€,\s]/g, "");
  const value = Number(cleaned);
  return { value, valid: cleaned !== "" && Number.isFinite(value) && value >= 0 };
}

function parseDate(raw: string) {
  if (!raw.trim()) return { value: "", valid: true };
  const match = /^(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})$/.exec(raw.trim());
  if (!match) return { value: "", valid: false };
  let year: number; let month: number; let day: number;
  if (match[1].length === 4) { year = Number(match[1]); month = Number(match[2]); day = Number(match[3]); }
  else { day = Number(match[1]); month = Number(match[2]); year = Number(match[3]); }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return { value: `${year.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, valid: parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day };
}

function parseStatus(raw: string): BudgetStatus | null {
  if (!raw.trim()) return "not-started";
  const normalized = raw.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  const found = budgetStatuses.find((status) => status.label.toLowerCase() === normalized || status.value.replaceAll("-", " ") === normalized);
  if (found) return found.value;
  if (["pending", "not booked", "open", "not started", "quoted"].includes(normalized)) return "not-started";
  if (["booked", "sourcing"].includes(normalized)) return "not-started";
  if (["partial", "part paid"].includes(normalized)) return "partially-paid";
  if (normalized === "complete") return "paid";
  return null;
}

function parseVendorStatus(raw: string, legacyStatus: string): VendorStatus | null {
  const normalized = (raw.trim() || legacyStatus.trim()).toLowerCase().replace(/[^a-z]+/g, " ").trim();
  if (!normalized) return "not-sourced";
  if (["not sourced", "not booked", "pending"].includes(normalized)) return "not-sourced";
  if (normalized === "sourcing") return "sourcing";
  if (["booked", "upcoming", "partially paid", "paid", "overdue"].includes(normalized)) return "booked";
  return raw.trim() ? null : "not-sourced";
}

export function analyseImport(sheet: BudgetSheet, mapping: ImportMapping, eventId: string | null, groups: BudgetGroup[], existingItems: BudgetItem[]): ImportCandidate[] {
  const existingGroupNames = new Map(groups.map((group) => [group.id, group.name]));
  const existingKeys = new Map(existingItems.map((item) => [budgetDuplicateKey(item, existingGroupNames.get(item.groupId) ?? ""), item.id]));
  const seen = new Set<string>();
  return sheet.rows.map((row, index) => {
    const value = (field: ImportField) => {
      const column = sheet.headers.findIndex((header) => mapping[header] === field);
      return column >= 0 ? (row[column] ?? "").trim() : "";
    };
    const groupName = value("group");
    const name = value("item");
    const budgeted = parseAmount(value("budgeted"));
    const invoiced = parseAmount(value("invoiced"));
    const paid = parseAmount(value("paid"));
    const date = parseDate(value("paymentDate"));
    const status = parseStatus(value("status"));
    const vendorStatus = parseVendorStatus(value("vendorStatus"), value("status"));
    const errors = [!groupName && "Missing group", !name && "Missing item", !budgeted.valid && "Invalid budgeted amount", !invoiced.valid && "Invalid invoice amount", !paid.valid && "Invalid paid amount", !date.valid && "Invalid date", !status && "Unknown status", !vendorStatus && "Unknown vendor status"].filter((message): message is string => Boolean(message));
    const item: BudgetItem = { id: crypto.randomUUID(), groupId: "", eventId, name, vendor: value("vendor"), vendorStatus: value("vendor") ? vendorStatus ?? "not-sourced" : "not-sourced", currency: "NGN", budgeted: budgeted.valid ? budgeted.value : 0, invoiced: invoiced.valid ? invoiced.value : 0, paid: paid.valid ? paid.value : 0, paymentDate: date.valid ? date.value : "", notes: value("notes"), status: status ?? "not-started", installments: [], attachments: [], createdAt: new Date().toISOString() };
    const key = budgetDuplicateKey(item, groupName);
    const candidate = { rowNumber: index + 2, groupName, item, errors, duplicateId: existingKeys.get(key), duplicateInFile: seen.has(key) };
    seen.add(key);
    return candidate;
  });
}

const templateItemNames = ["Venue hire", "Guest catering", "Floral styling", "DJ or live band", "Event photography", "Outfits and styling", "Guest transport", "Invitations and signage", "Event security", "Guest accommodation", "Planning support", "Other event cost"];
export const budgetTemplateCsv = [
  ["Budget Group", "Budget Item", "Vendor", "Vendor Status", "Budgeted Amount", "Invoiced", "Paid", "Status", "Payment Date", "Notes"],
  ...budgetGroupNames.map((name, index) => [name, templateItemNames[index], "", "Not sourced", "0", "0", "0", "Unpaid", "", ""]),
].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n";
