/**
 * Domain shapes shared by the UI and, later, the versioned API. Presentation components take these
 * types (or narrower view models) as props and never reach into a data source themselves.
 */

/** Calendar date in IST, YYYY-MM-DD. */
export type ISODate = string;
/** Date and time with offset, e.g. 2026-11-17T10:42:00+05:30 */
export type ISODateTime = string;

/** Four-aspect urgency ramp, borrowed from railway colour-light signals. */
export type Aspect = "red" | "yellow" | "double-yellow" | "green" | "none";

export type StaffRole =
  "Partner" | "Manager" | "Senior" | "Accountant" | "Article";

export interface StaffMember {
  id: string;
  name: string;
  initials: string;
  role: StaffRole;
  /** Weekly capacity in hours. */
  capacityHours: number;
  /** Hours of open work scheduled this week. */
  assignedHours: number;
}

export type Constitution =
  | "Private Ltd"
  | "Public Ltd"
  | "OPC"
  | "LLP"
  | "Partnership"
  | "Proprietorship"
  | "Individual"
  | "HUF"
  | "Trust";

export type GstScheme = "Monthly" | "QRMP" | "Composition" | "Unregistered";

export type Service =
  | "GST"
  | "Income tax"
  | "TDS"
  | "Audit"
  | "ROC"
  | "Accounting"
  | "Payroll"
  | "Advisory";

export interface ClientContact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface Client {
  code: string;
  name: string;
  constitution: Constitution;
  pan: string;
  gstin?: string;
  tan?: string;
  /** CIN for companies, LLPIN for LLPs. */
  regNo?: string;
  gstScheme: GstScheme;
  city: string;
  industry: string;
  partnerId: string;
  managerId: string;
  services: Service[];
  contact: ClientContact;
  /** Annual retainer, INR. */
  feeAnnual: number;
  since: ISODate;
  lastContact: ISODate;
  /** Statutory audit or tax audit applicable this FY. */
  audit?: boolean;
  employer?: boolean;
}

export type Regime =
  "GST" | "Income tax" | "TDS" | "ROC" | "Payroll" | "Engagement";

export type FilingStatus =
  | "Not started"
  | "Awaiting data"
  | "In preparation"
  | "In review"
  | "Ready to file"
  | "Filed";

export interface Filing {
  id: string;
  clientCode: string;
  form: string;
  regime: Regime;
  /** Human period label: Oct 2026, Q2 FY 2026-27, AY 2026-27, FY 2025-26 */
  period: string;
  due: ISODate;
  status: FilingStatus;
  assigneeId: string;
  reviewerId: string;
  filedOn?: ISODate;
  /** ARN, acknowledgement number, SRN or challan reference. */
  ackNo?: string;
  remindersSent: number;
  lastReminder?: ISODate;
  note?: string;
}

/** Filings that share a form, period and due date, as they appear on the Due Board. */
export interface DueBatch {
  key: string;
  form: string;
  regime: Regime;
  period: string;
  due: ISODate;
  total: number;
  filed: number;
  ready: number;
  review: number;
  inPrep: number;
  awaiting: number;
  notStarted: number;
}

export type ExceptionKind =
  | "Notice"
  | "Mismatch"
  | "DSC expiry"
  | "Bank feed"
  | "Fee overdue"
  | "Documents"
  | "Demand"
  | "Late fee";

export interface PracticeException {
  id: string;
  kind: ExceptionKind;
  clientCode: string;
  title: string;
  detail: string;
  raised: ISODate;
  due?: ISODate;
  ownerId: string;
  amount?: number;
  aspect: Aspect;
  steps: string[];
}

export type TaskStatus =
  "To do" | "In progress" | "Waiting on client" | "In review" | "Done";
export type TaskType =
  | "GST"
  | "Income tax"
  | "TDS"
  | "Audit"
  | "Accounting"
  | "ROC"
  | "Notice"
  | "Payroll"
  | "Advisory";

export interface Task {
  id: string;
  title: string;
  clientCode: string;
  type: TaskType;
  assigneeId: string;
  reviewerId: string;
  due: ISODate;
  status: TaskStatus;
  estimateHours: number;
  loggedHours: number;
  filingId?: string;
  checklist: { label: string; done: boolean }[];
}

export type DocumentSource = "WhatsApp" | "Email" | "Upload" | "Portal";
export type DocumentStatus = "To classify" | "Linked" | "Query raised";

export interface DocumentItem {
  id: string;
  name: string;
  clientCode?: string;
  from: string;
  source: DocumentSource;
  kind: string;
  period?: string;
  receivedAt: ISODateTime;
  status: DocumentStatus;
  sizeKb: number;
  pages?: number;
  linkedTo?: string;
}

export type InvoiceStatus = "Draft" | "Sent" | "Part paid" | "Paid" | "Overdue";

export interface InvoiceLine {
  description: string;
  sac: string;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientCode: string;
  date: ISODate;
  due: ISODate;
  lines: InvoiceLine[];
  taxable: number;
  gst: number;
  total: number;
  received: number;
  status: InvoiceStatus;
}

export type VoucherType =
  "Sales" | "Purchase" | "Payment" | "Receipt" | "Journal" | "Contra";

export interface VoucherEntry {
  ledger: string;
  dr?: number;
  cr?: number;
}

export interface Voucher {
  id: string;
  date: ISODate;
  number: string;
  type: VoucherType;
  party: string;
  narration: string;
  amount: number;
  gst?: { cgst: number; sgst: number; igst: number };
  entries: VoucherEntry[];
  attachment: boolean;
}

export type BankMatch = "Matched" | "Suggested" | "Unmatched";

export interface BankLine {
  id: string;
  date: ISODate;
  description: string;
  ref: string;
  debit?: number;
  credit?: number;
  balance: number;
  match: BankMatch;
  voucherNo?: string;
}

export interface TrialBalanceRow {
  group: string;
  ledger: string;
  debit?: number;
  credit?: number;
}

export interface ActivityItem {
  at: ISODateTime;
  who: string;
  text: string;
}
