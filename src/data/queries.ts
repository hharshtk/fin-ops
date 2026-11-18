/**
 * Read layer for the workstation. Phase 1 resolves from in-memory sample data; each function keeps
 * the signature a versioned API client will implement later (`/api/v1/...`), so pages and
 * components do not change when real data arrives. Reads are cached so they land in the static
 * shell; request-specific state (filters, selection) stays in the URL.
 */
import type {
  ActivityItem,
  Client,
  DueBatch,
  Filing,
  ISODate,
  StaffMember,
} from "@/domain/types";
import { addDays, daysBetween } from "@/lib/format";
import { TODAY } from "@/lib/today";
import {
  BANK_LINES,
  BANK_OPENING,
  BOOKS_CLIENT,
  TRIAL_BALANCE,
  VOUCHERS,
} from "./mock/books";
import { CLIENTS } from "./mock/clients";
import { DOCUMENTS } from "./mock/documents";
import { EXCEPTIONS } from "./mock/exceptions";
import { FILINGS } from "./mock/filings";
import { INVOICES, UNBILLED } from "./mock/invoices";
import { CURRENT_USER_ID, FIRM, STAFF } from "./mock/staff";
import { TASKS } from "./mock/tasks";

export async function getFirm() {
  "use cache";
  return FIRM;
}

export async function getCurrentUser(): Promise<StaffMember> {
  "use cache";
  return STAFF.find((s) => s.id === CURRENT_USER_ID) ?? STAFF[0]!;
}

export async function getStaff(): Promise<StaffMember[]> {
  "use cache";
  return STAFF;
}

export async function getClients(): Promise<Client[]> {
  "use cache";
  return CLIENTS;
}

export async function getClient(code: string): Promise<Client | undefined> {
  "use cache";
  return CLIENTS.find((c) => c.code === code);
}

export async function getFilings(): Promise<Filing[]> {
  "use cache";
  return FILINGS;
}

export async function getExceptions() {
  "use cache";
  return EXCEPTIONS;
}

export async function getTasks() {
  "use cache";
  return TASKS;
}

export async function getDocuments() {
  "use cache";
  return DOCUMENTS;
}

export async function getInvoices() {
  "use cache";
  return INVOICES;
}

export async function getUnbilled() {
  "use cache";
  return UNBILLED;
}

export async function getBooks(clientCode: string) {
  "use cache";
  if (clientCode !== BOOKS_CLIENT) return null;
  return {
    clientCode,
    period: "Oct 2026",
    vouchers: VOUCHERS,
    bankLines: BANK_LINES,
    bankOpening: BANK_OPENING,
    trialBalance: TRIAL_BALANCE,
  };
}

/** Clients whose books are kept by the firm in this sample. */
export async function getBooksClients(): Promise<string[]> {
  "use cache";
  return [BOOKS_CLIENT];
}

/**
 * Group filings into Due Board batches: same form, period and due date. Includes everything
 * overdue and not filed, plus every batch due within `days` of today.
 */
export function toDueBatches(
  filings: Filing[],
  days = 14,
  today: ISODate = TODAY,
): DueBatch[] {
  const horizon = addDays(today, days);
  return groupBatches(filings).filter((b) => {
    const open = b.total - b.filed;
    if (b.due < today) return open > 0;
    return b.due <= horizon;
  });
}

/** Every batch, regardless of date or state, sorted by due date. */
export function groupBatches(filings: Filing[]): DueBatch[] {
  const map = new Map<string, DueBatch>();
  for (const f of filings) {
    const key = `${f.form}|${f.period}|${f.due}`;
    let b = map.get(key);
    if (!b) {
      b = {
        key: `b-${f.form}-${f.period}-${f.due}`
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, ""),
        form: f.form,
        regime: f.regime,
        period: f.period,
        due: f.due,
        total: 0,
        filed: 0,
        ready: 0,
        review: 0,
        inPrep: 0,
        awaiting: 0,
        notStarted: 0,
      };
      map.set(key, b);
    }
    b.total++;
    if (f.status === "Filed") b.filed++;
    else if (f.status === "Ready to file") b.ready++;
    else if (f.status === "In review") b.review++;
    else if (f.status === "In preparation") b.inPrep++;
    else if (f.status === "Awaiting data") b.awaiting++;
    else b.notStarted++;
  }
  return [...map.values()].sort((a, b) =>
    a.due === b.due ? a.form.localeCompare(b.form) : a.due < b.due ? -1 : 1,
  );
}

/** Filings that belong to a batch key produced by toDueBatches. */
export function filingsInBatch(filings: Filing[], batch: DueBatch): Filing[] {
  return filings.filter(
    (f) =>
      f.form === batch.form && f.period === batch.period && f.due === batch.due,
  );
}

/** Synthetic activity trail for a filing, derived from its state. */
export function filingActivity(
  f: Filing,
  staff: Record<string, StaffMember>,
): ActivityItem[] {
  const who = staff[f.assigneeId]?.name ?? "Team";
  const reviewer = staff[f.reviewerId]?.name ?? "Reviewer";
  const items: ActivityItem[] = [];
  const created = addDays(f.due, -24);
  items.push({
    at: `${created}T09:00:00+05:30`,
    who: "System",
    text: `Created from client registration (${f.regime})`,
  });
  if (f.remindersSent > 0 && f.lastReminder) {
    items.push({
      at: `${f.lastReminder}T11:15:00+05:30`,
      who: "System",
      text: `WhatsApp reminder ${f.remindersSent} sent to client`,
    });
  }
  if (
    ["In preparation", "In review", "Ready to file", "Filed"].includes(f.status)
  ) {
    items.push({
      at: `${addDays(f.due, -6)}T15:40:00+05:30`,
      who,
      text: "Started preparation",
    });
  }
  if (["Ready to file", "Filed"].includes(f.status)) {
    items.push({
      at: `${addDays(f.due, -3)}T17:05:00+05:30`,
      who: reviewer,
      text: "Reviewed and approved",
    });
  }
  if (f.status === "Filed" && f.filedOn) {
    items.push({
      at: `${f.filedOn}T18:20:00+05:30`,
      who,
      text: `Filed. ${f.ackNo ?? ""}`.trim(),
    });
  }
  return items.sort((a, b) => (a.at < b.at ? 1 : -1));
}

/** Days a filing is late (positive) or remaining (negative is late). */
export function lateBy(due: ISODate, today: ISODate = TODAY): number {
  return -daysBetween(today, due);
}

/** Lightweight index the command palette searches on the client. */
export async function getSearchIndex() {
  "use cache";
  const clients = CLIENTS.map((c) => ({
    code: c.code,
    name: c.name,
    pan: c.pan,
    gstin: c.gstin ?? "",
    constitution: c.constitution,
  }));
  const batches = toDueBatches(FILINGS, 14).map((b) => ({
    key: b.key,
    label: `${b.form} · ${b.period}`,
    due: b.due,
    open: b.total - b.filed,
  }));
  return { clients, batches };
}
