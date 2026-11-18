import type { Invoice, InvoiceLine, InvoiceStatus } from "@/domain/types";
import { TODAY } from "@/lib/today";

/** Sample practice invoices raised by the firm. GST at 18% on professional services (SAC 9982). */

type Row = [
  number: number,
  client: string,
  date: string,
  lines: [string, number][],
  status: InvoiceStatus,
  received?: number,
];

const ROWS: Row[] = [
  [
    61,
    "JOS-045",
    "2026-08-14",
    [["Retainer: GST and TDS compliance, Q1 FY 2026-27", 45000]],
    "Overdue",
  ],
  [88, "JOS-045", "2026-09-14", [["Tax audit FY 2025-26", 45000]], "Overdue"],
  [
    94,
    "PAR-005",
    "2026-09-20",
    [
      ["Statutory audit FY 2025-26, final instalment", 180000],
      ["Tax audit FY 2025-26", 95000],
    ],
    "Paid",
    324500,
  ],
  [
    101,
    "CHA-024",
    "2026-09-28",
    [
      ["Tax audit FY 2025-26", 60000],
      ["ROC annual filings", 15000],
    ],
    "Overdue",
  ],
  [
    107,
    "TIW-029",
    "2026-10-03",
    [["Statutory audit FY 2025-26", 110000]],
    "Part paid",
    60000,
  ],
  [
    112,
    "MEH-014",
    "2026-10-05",
    [["Retainer Q2 FY 2026-27", 120000]],
    "Paid",
    141600,
  ],
  [
    115,
    "DES-003",
    "2026-10-05",
    [["Retainer Q2 FY 2026-27", 105000]],
    "Paid",
    123900,
  ],
  [
    118,
    "GAD-011",
    "2026-10-07",
    [["Transfer pricing study and Form 3CEB", 140000]],
    "Sent",
  ],
  [121, "PIN-049", "2026-10-09", [["Tax audit FY 2025-26", 70000]], "Overdue"],
  [
    124,
    "KOT-022",
    "2026-10-10",
    [["Retainer Q2 FY 2026-27", 90000]],
    "Paid",
    106200,
  ],
  [
    127,
    "BHA-016",
    "2026-10-12",
    [
      ["Tax audit FY 2025-26", 55000],
      ["Accounting Q2", 18000],
    ],
    "Overdue",
  ],
  [
    130,
    "VAI-013",
    "2026-10-15",
    [["Retainer Q2 FY 2026-27", 90000]],
    "Part paid",
    50000,
  ],
  [133, "THA-018", "2026-10-16", [["Retainer Q2 FY 2026-27", 97500]], "Sent"],
  [
    136,
    "KHA-036",
    "2026-10-18",
    [
      ["Export refund filing, Jul 2026", 25000],
      ["Retainer Q2", 57000],
    ],
    "Sent",
  ],
  [
    139,
    "SHA-008",
    "2026-10-20",
    [["Retainer Q2 FY 2026-27", 36000]],
    "Paid",
    42480,
  ],
  [142, "KAR-032", "2026-10-24", [["Retainer Q2 FY 2026-27", 86250]], "Sent"],
  [
    145,
    "GHO-030",
    "2026-10-27",
    [
      ["Startup India DPIIT application", 35000],
      ["Retainer Q2", 72000],
    ],
    "Sent",
  ],
  [
    148,
    "SON-009",
    "2026-10-30",
    [["Retainer Q2 FY 2026-27", 67500]],
    "Paid",
    79650,
  ],
  [151, "DIX-043", "2026-11-02", [["Retainer Q2 FY 2026-27", 52500]], "Sent"],
  [154, "NAI-052", "2026-11-03", [["Retainer Q2 FY 2026-27", 48000]], "Sent"],
  [
    157,
    "RAO-019",
    "2026-11-05",
    [["Response to 143(1) intimation", 15000]],
    "Sent",
  ],
  [
    160,
    "PAT-031",
    "2026-11-06",
    [["Representation u/s 143(2), first hearing", 40000]],
    "Sent",
  ],
  [
    163,
    "IYE-041",
    "2026-11-10",
    [["Capital gains computation, property purchase advisory", 18000]],
    "Sent",
  ],
  [166, "KAM-037", "2026-11-12", [["Retainer Q2 FY 2026-27", 60000]], "Sent"],
  [
    169,
    "GOK-033",
    "2026-11-14",
    [["Audit u/s 12A, Form 10B FY 2025-26", 75000]],
    "Paid",
    88500,
  ],
  [172, "MEH-014", "2026-11-16", [["GST refund advisory", 30000]], "Draft"],
];

export const INVOICES: Invoice[] = ROWS.map(
  ([n, client, date, lines, status, received]) => {
    const items: InvoiceLine[] = lines.map(([description, value]) => ({
      description,
      sac: "998221",
      amount: value,
    }));
    const taxable = items.reduce((s, l) => s + l.amount, 0);
    const gst = Math.round(taxable * 0.18);
    const [y, m, d] = date.split("-").map(Number);
    const dueDate = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + 15));
    const due = dueDate.toISOString().slice(0, 10);
    return {
      id: `inv-${n}`,
      number: `DIA/26-27/${String(n).padStart(4, "0")}`,
      clientCode: client,
      date,
      due,
      lines: items,
      taxable,
      gst,
      total: taxable + gst,
      received: received ?? 0,
      // A sent invoice past its due date reads as overdue.
      status: status === "Sent" && due < TODAY ? "Overdue" : status,
    };
  },
);

/** Unbilled work by client: hours logged on closed tasks not yet invoiced. */
export const UNBILLED: {
  clientCode: string;
  work: string;
  hours: number;
  value: number;
}[] = [
  {
    clientCode: "MEH-014",
    work: "GST 2B reconciliation, Oct",
    hours: 6,
    value: 18000,
  },
  {
    clientCode: "PAT-031",
    work: "143(2) submission drafting",
    hours: 14,
    value: 56000,
  },
  {
    clientCode: "CHA-024",
    work: "TDS corrections, 26Q Q2",
    hours: 5,
    value: 12500,
  },
  {
    clientCode: "GAD-011",
    work: "ITR-6 transfer pricing computation",
    hours: 11,
    value: 66000,
  },
  {
    clientCode: "BHA-016",
    work: "ASMT-10 reconciliation",
    hours: 9,
    value: 36000,
  },
  {
    clientCode: "JAD-034",
    work: "Bank stock audit Sep 2026",
    hours: 12,
    value: 35000,
  },
  {
    clientCode: "KHA-036",
    work: "Export refund follow-up",
    hours: 4,
    value: 12000,
  },
  {
    clientCode: "IYE-041",
    work: "26QB and advance tax planning",
    hours: 3,
    value: 9000,
  },
];
