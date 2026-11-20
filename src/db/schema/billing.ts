/**
 * Practice billing: the firm's own invoices to its clients, receipts and how they settle invoices,
 * and money spent on a client's behalf.
 *
 * An issued invoice is a legal document, so its party details and totals are frozen on the row
 * when it is issued and it is never deleted (only cancelled, or reversed by a credit note). What
 * has been received against it is not stored; it is the sum of its allocations.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { clients } from "./clients";
import {
  createdAt,
  customFields,
  day,
  id,
  jsonObject,
  matches,
  metadata,
  money,
  oneOf,
  PATTERN,
  rate,
  softDelete,
  tenantFk,
  tenantKey,
  timestamps,
  ts,
} from "./columns";
import { filings } from "./compliance";
import { documents } from "./documents";
import {
  INVOICE_STATUSES,
  INVOICE_TYPES,
  PAYMENT_MODES,
  PAYMENT_STATUSES,
  type InvoiceStatus,
  type InvoiceType,
  type PaymentMode,
  type PaymentStatus,
} from "./enums";
import { firmBranches, firmId, firmMembers } from "./firms";
import type { EInvoiceDetails, PartySnapshot } from "./json";
import { engagements, services } from "./services";

export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    firmId: firmId(),
    /** Issuing office, and so the GSTIN on the invoice. */
    branchId: uuid(),
    clientId: uuid().notNull(),
    type: text().$type<InvoiceType>().notNull().default("tax_invoice"),
    /** Assigned on issue, so drafts do not leave gaps in the series. Unique per firm. */
    number: text(),
    fy: text(),
    status: text().$type<InvoiceStatus>().notNull().default("draft"),
    issueDate: day(),
    dueDate: day(),
    /** GST state code of the recipient. Decides CGST + SGST or IGST. */
    placeOfSupply: text(),
    reverseCharge: boolean().notNull().default(false),
    /** Firm details as printed, frozen on issue. */
    supplier: jsonObject<Partial<PartySnapshot>>(),
    /** Client details as printed, frozen on issue. */
    recipient: jsonObject<Partial<PartySnapshot>>(),
    subtotal: money().notNull().default("0"),
    discountTotal: money().notNull().default("0"),
    taxableTotal: money().notNull().default("0"),
    cgstTotal: money().notNull().default("0"),
    sgstTotal: money().notNull().default("0"),
    igstTotal: money().notNull().default("0"),
    cessTotal: money().notNull().default("0"),
    roundOff: money().notNull().default("0"),
    total: money().notNull().default("0"),
    /** For credit and debit notes: the invoice being adjusted. */
    originalInvoiceId: uuid(),
    einvoice: jsonObject<EInvoiceDetails>(),
    notes: text(),
    terms: text(),
    issuedAt: ts(),
    issuedByUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    sentAt: ts(),
    cancelledAt: ts(),
    cancellationReason: text(),
    pdfDocumentId: uuid(),
    customFields: customFields(),
    metadata: metadata(),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (t) => [
    tenantKey("invoices_firm_id_id_key", t),
    uniqueIndex("invoices_number_key")
      .on(t.firmId, t.number)
      .where(sql`${t.number} is not null`),
    index("invoices_client_idx").on(t.firmId, t.clientId, t.issueDate),
    index("invoices_open_idx")
      .on(t.firmId, t.dueDate)
      .where(sql`${t.status} = 'issued'`),
    tenantFk("invoices_branch_fk", t.firmId, t.branchId, firmBranches),
    tenantFk("invoices_client_fk", t.firmId, t.clientId, clients),
    tenantFk("invoices_original_fk", t.firmId, t.originalInvoiceId, {
      firmId: t.firmId,
      id: t.id,
    }),
    tenantFk("invoices_pdf_fk", t.firmId, t.pdfDocumentId, documents),
    oneOf("invoices_type_check", t.type, INVOICE_TYPES),
    oneOf("invoices_status_check", t.status, INVOICE_STATUSES),
    matches("invoices_fy_check", t.fy, PATTERN.fy),
    matches(
      "invoices_place_of_supply_check",
      t.placeOfSupply,
      PATTERN.stateCode,
    ),
    check(
      "invoices_issued_check",
      sql`${t.status} = 'draft' or (${t.number} is not null and ${t.issueDate} is not null)`,
    ),
    check(
      "invoices_note_check",
      sql`${t.type} not in ('credit_note', 'debit_note') or ${t.originalInvoiceId} is not null`,
    ),
  ],
).enableRLS();

export const invoiceLines = pgTable(
  "invoice_lines",
  {
    id: id(),
    firmId: firmId(),
    invoiceId: uuid().notNull(),
    position: integer().notNull(),
    serviceId: uuid(),
    engagementId: uuid(),
    filingId: uuid(),
    description: text().notNull(),
    sacCode: text(),
    quantity: numeric({ precision: 12, scale: 3 }).notNull().default("1"),
    rate: money().notNull(),
    discount: money().notNull().default("0"),
    taxableAmount: money().notNull(),
    gstRate: rate().notNull().default("18.00"),
    cgst: money().notNull().default("0"),
    sgst: money().notNull().default("0"),
    igst: money().notNull().default("0"),
    cess: money().notNull().default("0"),
    amount: money().notNull(),
    /** Recovery of fees paid as the client's pure agent (Rule 33): no GST charged. */
    isReimbursement: boolean().notNull().default(false),
    metadata: metadata(),
  },
  (t) => [
    tenantKey("invoice_lines_firm_id_id_key", t),
    unique("invoice_lines_position_key").on(t.invoiceId, t.position),
    tenantFk(
      "invoice_lines_invoice_fk",
      t.firmId,
      t.invoiceId,
      invoices,
    ).onDelete("cascade"),
    tenantFk("invoice_lines_service_fk", t.firmId, t.serviceId, services),
    tenantFk(
      "invoice_lines_engagement_fk",
      t.firmId,
      t.engagementId,
      engagements,
    ),
    tenantFk("invoice_lines_filing_fk", t.firmId, t.filingId, filings),
    matches("invoice_lines_sac_check", t.sacCode, PATTERN.sac),
  ],
).enableRLS();

/**
 * Money received. Clients usually deduct TDS on professional fees (section 194J), so a receipt
 * records the amount that reached the bank and the TDS separately; together they settle invoices.
 */
export const payments = pgTable(
  "payments",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    receiptNumber: text(),
    receivedOn: day().notNull(),
    /** Amount credited to the bank. */
    amount: money().notNull(),
    tdsAmount: money().notNull().default("0"),
    tdsSection: text(),
    mode: text().$type<PaymentMode>().notNull(),
    /** UTR, cheque number, UPI reference or gateway payment ID. */
    reference: text(),
    /** Which of the firm's bank accounts received it. */
    depositedTo: text(),
    chequeDate: day(),
    status: text().$type<PaymentStatus>().notNull().default("received"),
    notes: text(),
    recordedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    tenantKey("payments_firm_id_id_key", t),
    index("payments_client_idx").on(t.firmId, t.clientId, t.receivedOn),
    tenantFk("payments_client_fk", t.firmId, t.clientId, clients),
    oneOf("payments_mode_check", t.mode, PAYMENT_MODES),
    oneOf("payments_status_check", t.status, PAYMENT_STATUSES),
    check(
      "payments_amounts_check",
      sql`${t.amount} >= 0 and ${t.tdsAmount} >= 0`,
    ),
  ],
).enableRLS();

/** How much of a receipt (bank amount plus TDS) settles which invoice. */
export const paymentAllocations = pgTable(
  "payment_allocations",
  {
    id: id(),
    firmId: firmId(),
    paymentId: uuid().notNull(),
    invoiceId: uuid().notNull(),
    amount: money().notNull(),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [
    unique("payment_allocations_key").on(t.paymentId, t.invoiceId),
    index("payment_allocations_invoice_idx").on(t.firmId, t.invoiceId),
    tenantFk(
      "payment_allocations_payment_fk",
      t.firmId,
      t.paymentId,
      payments,
    ).onDelete("cascade"),
    tenantFk("payment_allocations_invoice_fk", t.firmId, t.invoiceId, invoices),
    check("payment_allocations_amount_check", sql`${t.amount} > 0`),
  ],
).enableRLS();

/** Spent on a client's behalf (ROC fees, stamp duty, courier) and recovered on an invoice. */
export const disbursements = pgTable(
  "disbursements",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    spentOn: day().notNull(),
    description: text().notNull(),
    /** government_fee, stamp_duty, courier, travel, other */
    category: text(),
    amount: money().notNull(),
    paidByMemberId: uuid(),
    receiptDocumentId: uuid(),
    filingId: uuid(),
    billable: boolean().notNull().default(true),
    /** Invoice line it was recovered on. */
    invoiceLineId: uuid(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("disbursements_client_idx").on(t.firmId, t.clientId, t.spentOn),
    index("disbursements_unbilled_idx")
      .on(t.firmId, t.clientId)
      .where(
        sql`${t.billable} and ${t.invoiceLineId} is null and ${t.deletedAt} is null`,
      ),
    tenantFk("disbursements_client_fk", t.firmId, t.clientId, clients),
    tenantFk(
      "disbursements_paid_by_fk",
      t.firmId,
      t.paidByMemberId,
      firmMembers,
    ),
    tenantFk(
      "disbursements_receipt_fk",
      t.firmId,
      t.receiptDocumentId,
      documents,
    ),
    tenantFk("disbursements_filing_fk", t.firmId, t.filingId, filings),
    tenantFk(
      "disbursements_invoice_line_fk",
      t.firmId,
      t.invoiceLineId,
      invoiceLines,
    ),
    check("disbursements_amount_check", sql`${t.amount} > 0`),
  ],
).enableRLS();
