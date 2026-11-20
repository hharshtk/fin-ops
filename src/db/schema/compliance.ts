/**
 * The compliance engine.
 *
 * compliance_forms       catalogue of returns and forms (GSTR-3B, 26Q, ITR-3, AOC-4…). Built-in
 *                        rows have no firm; firms can add their own.
 * statutory_due_dates    the statutory calendar: one row per form, period and variant. When CBIC
 *                        or CBDT extends a date, this row changes and the change is pushed to
 *                        every open filing that uses it with one UPDATE.
 * compliance_obligations "this client files GSTR-1 monthly on this GSTIN": the recurring promise,
 *                        created by applicability rules or by hand.
 * filings                one obligation for one period: the unit of work on the Due Board.
 * notices                notices and demands from the departments.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { clientRegistrations, clients } from "./clients";
import {
  customFields,
  day,
  id,
  jsonArray,
  jsonObject,
  matches,
  metadata,
  money,
  oneOf,
  PATTERN,
  softDelete,
  tenantFk,
  tenantKey,
  timestamps,
  ts,
} from "./columns";
import {
  FILING_CLOSED,
  FILING_STATUSES,
  FORM_SUBJECTS,
  NOTICE_STATUSES,
  OBLIGATION_SOURCES,
  OBLIGATION_STATUSES,
  PERIODICITIES,
  REGIMES,
  type FilingStatus,
  type FormSubject,
  type NoticeStatus,
  type ObligationSource,
  type ObligationStatus,
  type Periodicity,
  type Regime,
} from "./enums";
import { firmId, firmMembers, firms } from "./firms";
import type {
  ApplicabilityRule,
  DueDateExtension,
  DueDateRule,
  Hearing,
} from "./json";
import { engagements } from "./services";

const closedFilingList = sql.raw(FILING_CLOSED.map((s) => `'${s}'`).join(", "));

export const complianceForms = pgTable(
  "compliance_forms",
  {
    id: id(),
    /** NULL for the built-in catalogue maintained by us; set for a firm's own forms. */
    firmId: uuid().references(() => firms.id, { onDelete: "cascade" }),
    code: text().notNull(),
    name: text().notNull(),
    regime: text().$type<Regime>().notNull(),
    /** CBIC, CBDT, MCA, EPFO, ESIC, state department. */
    authority: text(),
    periodicity: text().$type<Periodicity>().notNull(),
    /** What the form is filed against: the PAN or a registration type. */
    subject: text().$type<FormSubject>().notNull(),
    portal: text(),
    description: text(),
    /** Who owes this form. Read by the obligation generator. */
    applicability: jsonObject<ApplicabilityRule>(),
    /** Fallback when no calendar row exists for a period. */
    dueDateRule: jsonObject<DueDateRule>(),
    /** JSON Schema for the form-specific values captured on a filing (tax paid, refund…). */
    fields: jsonObject(),
    isActive: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("compliance_forms_builtin_code_key")
      .on(t.code)
      .where(sql`${t.firmId} is null`),
    uniqueIndex("compliance_forms_firm_code_key")
      .on(t.firmId, t.code)
      .where(sql`${t.firmId} is not null`),
    oneOf("compliance_forms_regime_check", t.regime, REGIMES),
    oneOf("compliance_forms_periodicity_check", t.periodicity, PERIODICITIES),
    oneOf("compliance_forms_subject_check", t.subject, FORM_SUBJECTS),
  ],
).enableRLS();

export const statutoryDueDates = pgTable(
  "statutory_due_dates",
  {
    id: id(),
    formId: uuid()
      .notNull()
      .references(() => complianceForms.id, { onDelete: "cascade" }),
    /** "2026-10" (month), "2026-27-Q2" (quarter), "2026-27-H1", "2026-27" (year). */
    periodKey: text().notNull(),
    periodStart: day().notNull(),
    periodEnd: day().notNull(),
    /**
     * Separates dates that differ within one form and period: QRMP state category X or Y,
     * ITR for non-audit, audit and transfer-pricing cases. "default" otherwise.
     */
    variant: text().notNull().default("default"),
    /** Limits the row to these GST states; NULL means all. */
    stateCodes: text().array(),
    /** Any other condition the variant needs, in the same shape as form applicability. */
    conditions: jsonObject<ApplicabilityRule>(),
    dueDate: day().notNull(),
    originalDueDate: day().notNull(),
    extensions: jsonArray<DueDateExtension>(),
    notes: text(),
    ...timestamps(),
  },
  (t) => [
    unique("statutory_due_dates_key").on(t.formId, t.periodKey, t.variant),
    index("statutory_due_dates_due_idx").on(t.dueDate),
    check(
      "statutory_due_dates_period_check",
      sql`${t.periodEnd} >= ${t.periodStart}`,
    ),
  ],
).enableRLS();

export const complianceObligations = pgTable(
  "compliance_obligations",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    /** NULL for PAN-level forms such as ITR or advance tax. */
    registrationId: uuid(),
    formId: uuid()
      .notNull()
      .references(() => complianceForms.id, { onDelete: "restrict" }),
    engagementId: uuid(),
    status: text().$type<ObligationStatus>().notNull().default("active"),
    source: text().$type<ObligationSource>().notNull().default("rule"),
    startsOn: day().notNull(),
    endsOn: day(),
    /** Calendar variant to use, when it cannot be worked out from the client's data. */
    dueDateVariant: text(),
    defaultAssigneeMemberId: uuid(),
    defaultReviewerMemberId: uuid(),
    /** Firm's own target: this many days before the statutory due date. */
    internalLeadDays: integer(),
    /** Reminder schedule, checklist template, per-filing fee and other per-client settings. */
    config: jsonObject(),
    metadata: metadata(),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (t) => [
    tenantKey("compliance_obligations_firm_id_id_key", t),
    unique("compliance_obligations_key")
      .on(t.firmId, t.clientId, t.registrationId, t.formId)
      .nullsNotDistinct(),
    index("compliance_obligations_form_idx").on(t.firmId, t.formId),
    tenantFk(
      "compliance_obligations_client_fk",
      t.firmId,
      t.clientId,
      clients,
    ).onDelete("cascade"),
    tenantFk(
      "compliance_obligations_registration_fk",
      t.firmId,
      t.registrationId,
      clientRegistrations,
    ),
    tenantFk(
      "compliance_obligations_engagement_fk",
      t.firmId,
      t.engagementId,
      engagements,
    ),
    tenantFk(
      "compliance_obligations_assignee_fk",
      t.firmId,
      t.defaultAssigneeMemberId,
      firmMembers,
    ),
    tenantFk(
      "compliance_obligations_reviewer_fk",
      t.firmId,
      t.defaultReviewerMemberId,
      firmMembers,
    ),
    oneOf("compliance_obligations_status_check", t.status, OBLIGATION_STATUSES),
    oneOf("compliance_obligations_source_check", t.source, OBLIGATION_SOURCES),
    check(
      "compliance_obligations_dates_check",
      sql`${t.endsOn} is null or ${t.endsOn} >= ${t.startsOn}`,
    ),
  ],
).enableRLS();

/**
 * Filings are statutory records, so they are never deleted: a filing that turns out not to be due
 * is marked `not_applicable` or `cancelled`. A revised return or correction statement is a new row
 * with `revision` + 1 pointing at the original.
 */
export const filings = pgTable(
  "filings",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    registrationId: uuid(),
    obligationId: uuid(),
    formId: uuid()
      .notNull()
      .references(() => complianceForms.id, { onDelete: "restrict" }),
    engagementId: uuid(),
    periodKey: text().notNull(),
    periodStart: day().notNull(),
    periodEnd: day().notNull(),
    /** Financial year the period falls in. */
    fy: text().notNull(),
    revision: integer().notNull().default(0),
    revisesFilingId: uuid(),
    /** Calendar row the due date came from. */
    statutoryDueDateId: uuid().references(() => statutoryDueDates.id, {
      onDelete: "set null",
    }),
    /** Effective due date, copied from the calendar so lists can sort and filter on it. */
    dueDate: day().notNull(),
    /** True when someone set the due date by hand; calendar extensions then skip this row. */
    dueDateOverridden: boolean().notNull().default(false),
    internalDueDate: day(),
    status: text().$type<FilingStatus>().notNull().default("not_started"),
    assigneeMemberId: uuid(),
    reviewerMemberId: uuid(),
    reviewedByMemberId: uuid(),
    reviewedAt: ts(),
    filedByMemberId: uuid(),
    filedOn: day(),
    /** ARN, acknowledgement number, SRN, token number or challan reference. */
    acknowledgementNo: text(),
    /** For attest work such as a tax audit report. */
    udin: text(),
    isNil: boolean().notNull().default(false),
    lateFee: money(),
    interest: money(),
    /** Form-specific values, shaped by `compliance_forms.fields`. */
    data: jsonObject(),
    notes: text(),
    customFields: customFields(),
    metadata: metadata(),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (t) => [
    tenantKey("filings_firm_id_id_key", t),
    unique("filings_period_key")
      .on(
        t.firmId,
        t.clientId,
        t.registrationId,
        t.formId,
        t.periodKey,
        t.revision,
      )
      .nullsNotDistinct(),
    index("filings_open_due_idx")
      .on(t.firmId, t.dueDate)
      .where(sql`${t.status} not in (${closedFilingList})`),
    index("filings_client_idx").on(t.firmId, t.clientId, t.dueDate),
    index("filings_assignee_idx").on(t.firmId, t.assigneeMemberId, t.status),
    index("filings_batch_idx").on(t.firmId, t.formId, t.periodKey),
    index("filings_calendar_idx").on(t.statutoryDueDateId),
    tenantFk("filings_client_fk", t.firmId, t.clientId, clients),
    tenantFk(
      "filings_registration_fk",
      t.firmId,
      t.registrationId,
      clientRegistrations,
    ),
    tenantFk(
      "filings_obligation_fk",
      t.firmId,
      t.obligationId,
      complianceObligations,
    ),
    tenantFk("filings_engagement_fk", t.firmId, t.engagementId, engagements),
    tenantFk("filings_revises_fk", t.firmId, t.revisesFilingId, {
      firmId: t.firmId,
      id: t.id,
    }),
    tenantFk("filings_assignee_fk", t.firmId, t.assigneeMemberId, firmMembers),
    tenantFk("filings_reviewer_fk", t.firmId, t.reviewerMemberId, firmMembers),
    tenantFk(
      "filings_reviewed_by_fk",
      t.firmId,
      t.reviewedByMemberId,
      firmMembers,
    ),
    tenantFk("filings_filed_by_fk", t.firmId, t.filedByMemberId, firmMembers),
    oneOf("filings_status_check", t.status, FILING_STATUSES),
    matches("filings_fy_check", t.fy, PATTERN.fy),
    check("filings_revision_check", sql`${t.revision} >= 0`),
    check("filings_period_check", sql`${t.periodEnd} >= ${t.periodStart}`),
    check(
      "filings_filed_check",
      sql`${t.status} <> 'filed' or ${t.filedOn} is not null`,
    ),
  ],
).enableRLS();

export const notices = pgTable(
  "notices",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    registrationId: uuid(),
    /** The return the notice is about, when there is one. */
    filingId: uuid(),
    regime: text().$type<Regime>().notNull(),
    /** CPC Bengaluru, jurisdictional AO, State GST officer, ROC. */
    authority: text(),
    /** Section or form: 143(1)(a), 139(9), 148A(b), ASMT-10, DRC-01, GSTR-3A. */
    noticeType: text().notNull(),
    /** Notice number or Document Identification Number. */
    referenceNo: text(),
    issuedOn: day(),
    receivedOn: day(),
    responseDueOn: day(),
    fy: text(),
    periodKey: text(),
    amountDemanded: money(),
    status: text().$type<NoticeStatus>().notNull().default("received"),
    assigneeMemberId: uuid(),
    reviewerMemberId: uuid(),
    hearings: jsonArray<Hearing>(),
    outcome: text(),
    closedOn: day(),
    data: jsonObject(),
    notes: text(),
    customFields: customFields(),
    metadata: metadata(),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("notices_firm_id_id_key", t),
    index("notices_open_idx")
      .on(t.firmId, t.responseDueOn)
      .where(sql`${t.status} <> 'closed' and ${t.deletedAt} is null`),
    index("notices_client_idx").on(t.firmId, t.clientId),
    tenantFk("notices_client_fk", t.firmId, t.clientId, clients),
    tenantFk(
      "notices_registration_fk",
      t.firmId,
      t.registrationId,
      clientRegistrations,
    ),
    tenantFk("notices_filing_fk", t.firmId, t.filingId, filings),
    tenantFk("notices_assignee_fk", t.firmId, t.assigneeMemberId, firmMembers),
    tenantFk("notices_reviewer_fk", t.firmId, t.reviewerMemberId, firmMembers),
    oneOf("notices_regime_check", t.regime, REGIMES),
    oneOf("notices_status_check", t.status, NOTICE_STATUSES),
    matches("notices_fy_check", t.fy, PATTERN.fy),
  ],
).enableRLS();
