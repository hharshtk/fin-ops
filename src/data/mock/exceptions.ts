import type { PracticeException } from "@/domain/types";

/** Sample exceptions: things that need a decision, not just a filing. Fictional. */
export const EXCEPTIONS: PracticeException[] = [
  {
    id: "x-101",
    kind: "Mismatch",
    clientCode: "MEH-014",
    title: "GSTR-2B short by ₹1,84,220 ITC",
    detail:
      "Oct 2026 purchase register shows 6 invoices from 2 suppliers missing in GSTR-2B. GSTR-3B due 20/11.",
    raised: "2026-11-14",
    due: "2026-11-20",
    ownerId: "sp",
    amount: 184220,
    aspect: "yellow",
    steps: [
      "Share supplier-wise mismatch list with client on WhatsApp",
      "Ask suppliers to file or amend GSTR-1 before 20/11",
      "Decide ITC to defer in Oct GSTR-3B",
    ],
  },
  {
    id: "x-102",
    kind: "Demand",
    clientCode: "RAO-019",
    title: "Demand u/s 156: ₹2,31,400",
    detail:
      "Intimation u/s 143(1) for AY 2025-26 disallows deduction u/s 54F. Response window on e-filing portal open.",
    raised: "2026-11-03",
    due: "2026-12-03",
    ownerId: "kb",
    amount: 231400,
    aspect: "green",
    steps: [
      "Compare intimation with filed return computation",
      "Collect sale deed and new-asset purchase proof",
      "File response: disagree with demand, upload evidence",
    ],
  },
  {
    id: "x-103",
    kind: "Bank feed",
    clientCode: "SHA-008",
    title: "37 bank lines unreconciled since 02/11",
    detail:
      "HDFC current account feed has 37 unmatched entries (₹6,48,915 net). Oct books cannot close.",
    raised: "2026-11-02",
    ownerId: "pn",
    amount: 648915,
    aspect: "red",
    steps: [
      "Apply suggested matches (21 lines)",
      "Ask client for narration on 16 UPI receipts",
      "Close Oct books and lock period",
    ],
  },
  {
    id: "x-104",
    kind: "DSC expiry",
    clientCode: "KOT-022",
    title: "Director DSC expires 21/11",
    detail:
      "Class 3 DSC of Prakash Kothari expires on 21/11. Needed for MGT-7 (due 28/11).",
    raised: "2026-11-10",
    due: "2026-11-21",
    ownerId: "rs",
    aspect: "double-yellow",
    steps: [
      "Send renewal link to director",
      "Video verification",
      "Register new DSC on MCA V3",
    ],
  },
  {
    id: "x-105",
    kind: "Fee overdue",
    clientCode: "JOS-045",
    title: "Fees overdue 64 days: ₹1,06,200",
    detail:
      "Invoices DIA/26-27/0061 and 0088 unpaid. Client also late on TDS data this month.",
    raised: "2026-09-14",
    ownerId: "ai",
    amount: 106200,
    aspect: "red",
    steps: [
      "Partner call with Abhay Joshi",
      "Agree payment plan",
      "Hold non-statutory work until cleared",
    ],
  },
  {
    id: "x-106",
    kind: "Notice",
    clientCode: "BHA-016",
    title: "ASMT-10 scrutiny reply due 23/11",
    detail:
      "Difference of ₹3,62,410 between ITC claimed in GSTR-3B and GSTR-2A for FY 2024-25.",
    raised: "2026-10-24",
    due: "2026-11-23",
    ownerId: "sp",
    amount: 362410,
    aspect: "double-yellow",
    steps: [
      "Reconcile supplier-wise for FY 2024-25",
      "Draft reply in ASMT-11",
      "Partner review",
    ],
  },
  {
    id: "x-107",
    kind: "Late fee",
    clientCode: "CHA-024",
    title: "26Q Q2 late: fee u/s 234E accruing",
    detail:
      "Return due 31/10 not filed. ₹200 per day applies until filing; deductee PAN errors unresolved.",
    raised: "2026-11-01",
    due: "2026-10-31",
    ownerId: "is",
    aspect: "red",
    steps: [
      "Fix 4 PAN errors with client",
      "Map challans",
      "File return and download Form 16A",
    ],
  },
  {
    id: "x-108",
    kind: "Documents",
    clientCode: "THA-018",
    title: "Purchase registers missing for 3 stores",
    detail:
      "Andheri, Thane and Vashi stores have not shared Oct purchase data. Blocks GSTR-3B.",
    raised: "2026-11-12",
    due: "2026-11-20",
    ownerId: "vj",
    aspect: "yellow",
    steps: [
      "Second WhatsApp reminder",
      "Call store accountants",
      "File with available data if needed",
    ],
  },
  {
    id: "x-109",
    kind: "Notice",
    clientCode: "PAT-031",
    title: "Scrutiny u/s 143(2): submission 24/11",
    detail:
      "Limited scrutiny for AY 2025-26 on cash deposits and sundry creditors. Draft reply in review.",
    raised: "2026-10-08",
    due: "2026-11-24",
    ownerId: "is",
    aspect: "double-yellow",
    steps: [
      "Creditor confirmations (9 of 14 received)",
      "Cash book and deposit trail",
      "Upload on e-proceedings",
    ],
  },
  {
    id: "x-110",
    kind: "Mismatch",
    clientCode: "KHA-036",
    title: "Export refund held: shipping bill mismatch",
    detail:
      "IGST refund for Aug 2026 (₹4,12,880) held for 3 shipping bills with invoice value mismatch.",
    raised: "2026-11-06",
    ownerId: "rs",
    amount: 412880,
    aspect: "green",
    steps: [
      "Get corrected invoices",
      "Amend in GSTR-1",
      "Track refund on ICEGATE",
    ],
  },
];
