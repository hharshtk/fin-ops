/**
 * TypeScript shapes for JSONB columns. The database stores whatever JSON it is given, so these
 * types (and validation at the write boundary) are what keep the data consistent. Every field is
 * optional unless the app cannot work without it, so older rows stay valid as shapes grow.
 */
import type { MessageChannel, RegistrationType } from "./enums";

export interface Address {
  line1?: string;
  line2?: string;
  locality?: string;
  city?: string;
  district?: string;
  /** Name of the state or UT. */
  state?: string;
  /** GST state code, e.g. "27" for Maharashtra. */
  stateCode?: string;
  pincode?: string;
  country?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  required?: boolean;
  done?: boolean;
  doneAt?: string;
  doneByMemberId?: string;
}

export interface ChecklistTemplateItem {
  label: string;
  required?: boolean;
}

/** GST scheme in force from a date. Taxpayers can switch between monthly and QRMP each quarter. */
export interface GstSchemePeriod {
  from: string;
  scheme: "monthly" | "qrmp" | "composition";
}

/** `client_registrations.attributes` by registration type. */
export interface GstinAttributes {
  taxpayerType?:
    | "regular"
    | "composition"
    | "isd"
    | "tds"
    | "tcs"
    | "casual"
    | "nrtp"
    | "sez_unit"
    | "sez_developer";
  tradeName?: string;
  schemes?: GstSchemePeriod[];
  eInvoicing?: boolean;
  /** For QRMP due dates: category X (22nd) or Y (24th) state group. */
  stateCategory?: "X" | "Y";
}

export interface TanAttributes {
  deductorCategory?: string;
  aoCode?: string;
}

export interface CompanyAttributes {
  rocCode?: string;
  authorisedCapital?: string;
  paidUpCapital?: string;
  listed?: boolean;
  lastAgmOn?: string;
  financialYearEnd?: string;
}

export type RegistrationAttributes =
  GstinAttributes | TanAttributes | CompanyAttributes | Record<string, unknown>;

/** A due date moved by notification. The latest entry wins. */
export interface DueDateExtension {
  from: string;
  to: string;
  notification?: string;
  notifiedOn?: string;
  url?: string;
}

/**
 * Declarative rule that decides whether a client owes a form. Evaluated by the obligation
 * generator; reviewed by the domain expert before a rule goes live.
 */
export interface ApplicabilityRule {
  subject?: RegistrationType | "pan";
  constitutions?: string[];
  gstSchemes?: GstSchemePeriod["scheme"][];
  taxpayerTypes?: string[];
  auditApplicable?: boolean;
  employer?: boolean;
  [key: string]: unknown;
}

/** Fallback due-date rule for forms without a calendar row (e.g. firm-defined forms). */
export interface DueDateRule {
  /** Months after the period end. */
  offsetMonths?: number;
  /** Day of that month. */
  day?: number;
  /** Or a fixed date in the year after the period, "MM-DD". */
  fixed?: string;
}

export interface Hearing {
  on: string;
  mode?: "physical" | "virtual" | "written";
  outcome?: string;
}

export interface DocumentRequestItem {
  id: string;
  label: string;
  required?: boolean;
  status: "pending" | "received" | "waived";
  documentId?: string;
  receivedAt?: string;
}

export interface PartySnapshot {
  legalName: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  address?: Address;
  stateCode?: string;
  email?: string;
  phone?: string;
}

export interface EInvoiceDetails {
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  signedQr?: string;
  cancelledAt?: string;
}

/** RRULE-like schedule for recurring tasks and automations. Interpreted in IST. */
export interface Schedule {
  freq: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  interval?: number;
  byMonthDay?: number[];
  byWeekday?: number[];
  byMonth?: number[];
  time?: string;
}

export interface AutomationAction {
  type: "send_message" | "create_task" | "notify" | "update_status";
  channel?: MessageChannel;
  templateKey?: string;
  to?: "primary_contact" | "all_contacts" | "assignee" | "partner";
  [key: string]: unknown;
}

export interface FieldChange {
  from: unknown;
  to: unknown;
}

export interface CustomFieldOption {
  value: string;
  label: string;
}
