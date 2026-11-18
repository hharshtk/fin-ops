import type { Client, Filing, FilingStatus, Regime } from "@/domain/types";
import { addDays } from "@/lib/format";
import { CLIENTS } from "./clients";
import { TEAMS } from "./staff";

/*
 * Sample filings, derived from each client's registrations the way a practice tool would create
 * them (GST scheme, TAN, constitution, employer status). Due dates follow the usual statutory
 * calendar for Nov 2026 in Maharashtra; they are sample data and not compliance advice.
 */

/** Deterministic 0..1 from a string (FNV-1a). */
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function digits(seed: string, n: number): string {
  let out = "";
  let i = 0;
  while (out.length < n) out += String(Math.floor(rand(`${seed}:${i++}`) * 10));
  return out;
}

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function ack(form: string, seed: string, filedOn: string): string {
  const mm = filedOn.slice(5, 7);
  const yy = filedOn.slice(2, 4);
  if (/^(GSTR|IFF|PMT|CMP)/.test(form)) {
    const letter =
      LETTERS[Math.floor(rand(seed + "l") * LETTERS.length)] ?? "K";
    return `AA27${mm}${yy}${digits(seed, 6)}${letter}`;
  }
  if (/^ITR|3CEB/.test(form)) return digits(seed, 15);
  if (/^2[46]Q/.test(form)) return `Token ${digits(seed, 15)}`;
  if (form === "Challan 281") return `BSR 0510308 · ${digits(seed, 5)}`;
  if (form === "Form 16A") return `Request ${digits(seed, 8)}`;
  if (/AOC|MGT|Form 8/.test(form)) return `SRN AB${digits(seed, 7)}`;
  if (form === "PF ECR") return `TRRN ${digits(seed, 13)}`;
  if (form === "ESI") return `Challan ${digits(seed, 12)}`;
  return digits(seed, 10);
}

function assigneeFor(c: Client, form: string): string {
  const team = TEAMS[c.managerId] ?? ["sp"];
  return team[Math.floor(rand(c.code + form) * team.length)] ?? "sp";
}

type Bucket = [upTo: number, status: FilingStatus];

function pick(seed: string, buckets: Bucket[]): FilingStatus {
  const r = rand(seed);
  for (const [upTo, s] of buckets) if (r < upTo) return s;
  return buckets[buckets.length - 1]?.[1] ?? "Not started";
}

interface Spec {
  form: string;
  regime: Regime;
  period: string;
  due: string;
  applies: (c: Client) => boolean;
  /** Status when no override applies. */
  status: FilingStatus | Bucket[];
  overrides?: Record<string, Partial<Filing>>;
}

const company = (c: Client) =>
  ["Private Ltd", "Public Ltd", "OPC"].includes(c.constitution);
const monthly = (c: Client) => c.gstScheme === "Monthly";
const qrmp = (c: Client) => c.gstScheme === "QRMP";

const SPECS: Spec[] = [
  // GST, monthly filers
  {
    form: "GSTR-1",
    regime: "GST",
    period: "Sep 2026",
    due: "2026-10-11",
    applies: monthly,
    status: "Filed",
  },
  {
    form: "GSTR-3B",
    regime: "GST",
    period: "Sep 2026",
    due: "2026-10-20",
    applies: monthly,
    status: "Filed",
  },
  {
    form: "GSTR-1",
    regime: "GST",
    period: "Oct 2026",
    due: "2026-11-11",
    applies: monthly,
    status: "Filed",
    overrides: {
      "PAT-031": {
        status: "Awaiting data",
        remindersSent: 3,
        lastReminder: "2026-11-15",
        note: "Sales register for Oct not received. Accountant on leave till 18/11.",
      },
      "BHA-016": {
        status: "In preparation",
        note: "B2C invoices being reconciled with POS export.",
      },
      "KHA-036": {
        status: "Awaiting data",
        remindersSent: 2,
        lastReminder: "2026-11-14",
        note: "Export invoices and shipping bills pending from client.",
      },
    },
  },
  {
    form: "GSTR-3B",
    regime: "GST",
    period: "Oct 2026",
    due: "2026-11-20",
    applies: monthly,
    status: [
      [0.18, "Filed"],
      [0.42, "Ready to file"],
      [0.56, "In review"],
      [0.76, "In preparation"],
      [1, "Awaiting data"],
    ],
    overrides: {
      "MEH-014": {
        status: "In review",
        note: "ITC held back pending GSTR-2B mismatch of ₹1,84,220.",
      },
      "PAT-031": {
        status: "Awaiting data",
        remindersSent: 3,
        lastReminder: "2026-11-15",
      },
      "KHA-036": {
        status: "Awaiting data",
        remindersSent: 2,
        lastReminder: "2026-11-14",
      },
      "BHA-016": { status: "Not started" },
      "THA-018": {
        status: "Awaiting data",
        remindersSent: 1,
        lastReminder: "2026-11-16",
        note: "Purchase register for 3 stores pending.",
      },
    },
  },
  {
    form: "GSTR-1",
    regime: "GST",
    period: "Nov 2026",
    due: "2026-12-11",
    applies: monthly,
    status: "Not started",
  },

  // GST, QRMP filers
  {
    form: "GSTR-1",
    regime: "GST",
    period: "Q2 FY 2026-27",
    due: "2026-10-13",
    applies: qrmp,
    status: "Filed",
  },
  {
    form: "GSTR-3B",
    regime: "GST",
    period: "Q2 FY 2026-27",
    due: "2026-10-22",
    applies: qrmp,
    status: "Filed",
  },
  {
    form: "IFF",
    regime: "GST",
    period: "Oct 2026",
    due: "2026-11-13",
    applies: qrmp,
    status: "Filed",
  },
  {
    form: "PMT-06",
    regime: "GST",
    period: "Oct 2026",
    due: "2026-11-25",
    applies: qrmp,
    status: [
      [0.2, "Filed"],
      [0.5, "Ready to file"],
      [0.75, "In preparation"],
      [1, "Awaiting data"],
    ],
  },

  // GST, composition
  {
    form: "CMP-08",
    regime: "GST",
    period: "Q2 FY 2026-27",
    due: "2026-10-18",
    applies: (c) => c.gstScheme === "Composition",
    status: "Filed",
  },

  // TDS
  {
    form: "Challan 281",
    regime: "TDS",
    period: "Oct 2026",
    due: "2026-11-07",
    applies: (c) => Boolean(c.tan),
    status: "Filed",
    overrides: {
      "JOS-045": {
        status: "Awaiting data",
        remindersSent: 2,
        lastReminder: "2026-11-12",
        note: "Contractor payments for Oct not shared. Interest u/s 201(1A) running.",
      },
    },
  },
  {
    form: "26Q",
    regime: "TDS",
    period: "Q2 FY 2026-27",
    due: "2026-10-31",
    applies: (c) => Boolean(c.tan),
    status: "Filed",
    overrides: {
      "CHA-024": {
        status: "In preparation",
        note: "PAN errors on 4 deductee rows; corrected challan mapping in progress. Fee u/s 234E accruing.",
      },
    },
  },
  {
    form: "24Q",
    regime: "TDS",
    period: "Q2 FY 2026-27",
    due: "2026-10-31",
    applies: (c) => Boolean(c.tan) && Boolean(c.employer),
    status: "Filed",
  },
  {
    form: "Form 16A",
    regime: "TDS",
    period: "Q2 FY 2026-27",
    due: "2026-11-15",
    applies: (c) => Boolean(c.tan),
    status: "Filed",
    overrides: {
      "NAI-052": {
        status: "Ready to file",
        note: "Downloaded from TRACES; to be signed and shared.",
      },
      "SON-009": { status: "In preparation" },
    },
  },
  {
    form: "Challan 281",
    regime: "TDS",
    period: "Nov 2026",
    due: "2026-12-07",
    applies: (c) => Boolean(c.tan),
    status: "Not started",
  },
  {
    form: "26QB",
    regime: "TDS",
    period: "Oct 2026",
    due: "2026-11-30",
    applies: (c) => c.code === "IYE-041",
    status: "Awaiting data",
    overrides: {
      "IYE-041": {
        remindersSent: 1,
        lastReminder: "2026-11-13",
        note: "Flat purchase on 15/10. Seller PAN and payment schedule pending.",
      },
    },
  },

  // ROC / MCA
  {
    form: "AOC-4",
    regime: "ROC",
    period: "FY 2025-26",
    due: "2026-10-29",
    applies: (c) => company(c) && c.constitution !== "OPC",
    status: "Filed",
    overrides: {
      "TIW-029": {
        status: "Awaiting data",
        remindersSent: 4,
        lastReminder: "2026-11-16",
        note: "Signed financial statements and board report awaited. Additional fee accruing per day.",
      },
    },
  },
  {
    form: "MGT-7",
    regime: "ROC",
    period: "FY 2025-26",
    due: "2026-11-28",
    applies: (c) => company(c),
    status: [
      [0.15, "Filed"],
      [0.4, "In preparation"],
      [0.6, "In review"],
      [0.8, "Not started"],
      [1, "Awaiting data"],
    ],
    overrides: { "PAR-005": { status: "Filed" } },
  },
  {
    form: "Form 8",
    regime: "ROC",
    period: "FY 2025-26",
    due: "2026-10-30",
    applies: (c) => c.constitution === "LLP",
    status: "Filed",
    overrides: {
      "KAM-037": {
        status: "In preparation",
        note: "Partner DSC renewed on 12/11. Form ready for certification.",
      },
    },
  },

  // Income tax
  {
    form: "ITR-6",
    regime: "Income tax",
    period: "AY 2026-27",
    due: "2026-10-31",
    applies: (c) => company(c) && c.code !== "GAD-011",
    status: "Filed",
    overrides: {
      "CHA-024": {
        status: "In review",
        note: "Tax audit report filed 29/09. Return held for MAT credit working.",
      },
      "PIN-049": {
        status: "Awaiting data",
        remindersSent: 3,
        lastReminder: "2026-11-11",
        note: "Board-approved accounts received late; foreign remittance details pending.",
      },
    },
  },
  {
    form: "Form 3CEB",
    regime: "Income tax",
    period: "FY 2025-26",
    due: "2026-10-31",
    applies: (c) => c.code === "GAD-011",
    status: "Filed",
  },
  {
    form: "ITR-6",
    regime: "Income tax",
    period: "AY 2026-27",
    due: "2026-11-30",
    applies: (c) => c.code === "GAD-011",
    status: "In preparation",
    overrides: {
      "GAD-011": { note: "Transfer pricing case. 3CEB filed 30/10." },
    },
  },
  {
    form: "ITR-5",
    regime: "Income tax",
    period: "AY 2026-27",
    due: "2026-10-31",
    applies: (c) =>
      (c.constitution === "LLP" || c.constitution === "Partnership") &&
      Boolean(c.audit),
    status: "Filed",
    overrides: {
      "BHA-016": {
        status: "Awaiting data",
        remindersSent: 2,
        lastReminder: "2026-11-10",
        note: "Stock valuation statement awaited. Section 234A interest accruing.",
      },
    },
  },
  {
    form: "ITR-3",
    regime: "Income tax",
    period: "AY 2026-27",
    due: "2026-10-31",
    applies: (c) => c.constitution === "Proprietorship" && Boolean(c.audit),
    status: "Filed",
  },
  {
    form: "ITR-7",
    regime: "Income tax",
    period: "AY 2026-27",
    due: "2026-10-31",
    applies: (c) => c.constitution === "Trust" && Boolean(c.audit),
    status: "Filed",
  },
  {
    form: "Advance tax",
    regime: "Income tax",
    period: "Q3 FY 2026-27",
    due: "2026-12-15",
    applies: (c) =>
      ["Individual", "HUF", "Trust"].includes(c.constitution) ||
      c.code === "GAD-011",
    status: "Not started",
  },

  // Payroll
  {
    form: "PF ECR",
    regime: "Payroll",
    period: "Oct 2026",
    due: "2026-11-15",
    applies: (c) => Boolean(c.employer),
    status: "Filed",
    overrides: {
      "DES-003": {
        status: "In preparation",
        note: "Two new joiners without UAN. Damages u/s 14B apply after due date.",
      },
    },
  },
  {
    form: "ESI",
    regime: "Payroll",
    period: "Oct 2026",
    due: "2026-11-15",
    applies: (c) => Boolean(c.employer) && c.constitution !== "Trust",
    status: "Filed",
  },
  {
    form: "PT (MH)",
    regime: "Payroll",
    period: "Nov 2026",
    due: "2026-11-30",
    applies: (c) => Boolean(c.employer),
    status: [
      [0.5, "Not started"],
      [1, "In preparation"],
    ],
  },
];

/** Engagement deadlines and notice replies that sit on the same timetable as returns. */
const ONE_OFF: Filing[] = [
  {
    id: "f-jad-stock",
    clientCode: "JAD-034",
    form: "Bank stock audit",
    regime: "Engagement",
    period: "Sep 2026",
    due: "2026-11-21",
    status: "In preparation",
    assigneeId: "vj",
    reviewerId: "rs",
    remindersSent: 0,
    note: "Fieldwork done 14/11. Report due to Bank of Maharashtra, Hadapsar branch.",
  },
  {
    id: "f-bha-asmt",
    clientCode: "BHA-016",
    form: "Reply to ASMT-10",
    regime: "GST",
    period: "FY 2024-25",
    due: "2026-11-23",
    status: "In preparation",
    assigneeId: "sp",
    reviewerId: "rs",
    remindersSent: 1,
    lastReminder: "2026-11-12",
    note: "Scrutiny of returns: ITC claimed vs GSTR-2A difference ₹3,62,410.",
  },
  {
    id: "f-pat-1432",
    clientCode: "PAT-031",
    form: "Reply u/s 143(2)",
    regime: "Income tax",
    period: "AY 2025-26",
    due: "2026-11-24",
    status: "In review",
    assigneeId: "is",
    reviewerId: "kb",
    remindersSent: 0,
    note: "Limited scrutiny: large cash deposits and sundry creditors.",
  },
];

function build(): Filing[] {
  const out: Filing[] = [];
  for (const spec of SPECS) {
    for (const c of CLIENTS) {
      if (!spec.applies(c)) continue;
      const seed = `${c.code}|${spec.form}|${spec.period}`;
      const status = Array.isArray(spec.status)
        ? pick(seed, spec.status)
        : spec.status;
      const base: Filing = {
        id: `f-${c.code.toLowerCase()}-${spec.form.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${spec.period.toLowerCase().replace(/[^a-z0-9]+/g, "")}`,
        clientCode: c.code,
        form: spec.form,
        regime: spec.regime,
        period: spec.period,
        due: spec.due,
        status,
        assigneeId: assigneeFor(c, spec.form),
        reviewerId: c.managerId,
        remindersSent: 0,
      };
      const merged: Filing = { ...base, ...spec.overrides?.[c.code] };
      if (merged.status === "Filed" && !merged.filedOn) {
        const early = 1 + Math.floor(rand(seed + "d") * 5);
        let filedOn = addDays(merged.due, -early);
        if (filedOn > "2026-11-17") filedOn = "2026-11-16";
        merged.filedOn = filedOn;
        merged.ackNo = ack(merged.form, seed, filedOn);
      }
      if (merged.status === "Awaiting data" && merged.remindersSent === 0) {
        merged.remindersSent = 1 + Math.floor(rand(seed + "r") * 2);
        merged.lastReminder = "2026-11-14";
      }
      out.push(merged);
    }
  }
  return [...out, ...ONE_OFF];
}

export const FILINGS: Filing[] = build();
