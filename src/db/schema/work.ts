/**
 * Work management: tasks (linked to a filing, notice or engagement, or standalone), task templates
 * with checklists, recurring work that is not statutory (monthly bookkeeping, MIS), time entries,
 * and comments on anything.
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
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { invoices } from "./billing";
import { clients } from "./clients";
import {
  customFields,
  day,
  id,
  jsonArray,
  jsonObject,
  metadata,
  money,
  oneOf,
  softDelete,
  tags,
  tenantFk,
  tenantKey,
  timestamps,
  ts,
} from "./columns";
import { complianceForms, filings, notices } from "./compliance";
import {
  COMMENT_VISIBILITIES,
  SERVICE_CATEGORIES,
  TASK_CLOSED,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TIME_ENTRY_STATUSES,
  type CommentVisibility,
  type EntityType,
  type ServiceCategory,
  type TaskPriority,
  type TaskStatus,
  type TimeEntryStatus,
} from "./enums";
import { firmId, firmMembers } from "./firms";
import type { ChecklistItem, ChecklistTemplateItem, Schedule } from "./json";
import { engagements, services } from "./services";

const closedTaskList = sql.raw(TASK_CLOSED.map((s) => `'${s}'`).join(", "));

/** Checklists and defaults applied when a task is created for a form or service. */
export const taskTemplates = pgTable(
  "task_templates",
  {
    id: id(),
    firmId: firmId(),
    name: text().notNull(),
    category: text().$type<ServiceCategory>().notNull(),
    /** Applied automatically to filings of this form. */
    formId: uuid().references(() => complianceForms.id, {
      onDelete: "set null",
    }),
    serviceId: uuid(),
    /** Title with placeholders, e.g. "{form} · {period}". */
    titleTemplate: text(),
    description: text(),
    checklist: jsonArray<ChecklistTemplateItem>(),
    defaultEstimateMinutes: integer(),
    /** Due date relative to the filing's due date, e.g. -3. */
    dueOffsetDays: integer(),
    isActive: boolean().notNull().default(true),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("task_templates_firm_id_id_key", t),
    index("task_templates_form_idx").on(t.firmId, t.formId),
    tenantFk("task_templates_service_fk", t.firmId, t.serviceId, services),
    oneOf("task_templates_category_check", t.category, SERVICE_CATEGORIES),
  ],
).enableRLS();

/** Repeating work that has no statutory form behind it. */
export const recurringTasks = pgTable(
  "recurring_tasks",
  {
    id: id(),
    firmId: firmId(),
    templateId: uuid(),
    clientId: uuid(),
    engagementId: uuid(),
    title: text().notNull(),
    description: text(),
    schedule: jsonObject<Schedule>(),
    assigneeMemberId: uuid(),
    reviewerMemberId: uuid(),
    nextRunOn: day(),
    lastRunOn: day(),
    isActive: boolean().notNull().default(true),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("recurring_tasks_firm_id_id_key", t),
    index("recurring_tasks_next_run_idx")
      .on(t.nextRunOn)
      .where(sql`${t.isActive} and ${t.deletedAt} is null`),
    tenantFk(
      "recurring_tasks_template_fk",
      t.firmId,
      t.templateId,
      taskTemplates,
    ),
    tenantFk("recurring_tasks_client_fk", t.firmId, t.clientId, clients),
    tenantFk(
      "recurring_tasks_engagement_fk",
      t.firmId,
      t.engagementId,
      engagements,
    ),
    tenantFk(
      "recurring_tasks_assignee_fk",
      t.firmId,
      t.assigneeMemberId,
      firmMembers,
    ),
    tenantFk(
      "recurring_tasks_reviewer_fk",
      t.firmId,
      t.reviewerMemberId,
      firmMembers,
    ),
  ],
).enableRLS();

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    firmId: firmId(),
    /** Per-firm running number shown as T-1042. Allocated from `number_sequences`. */
    number: integer().notNull(),
    title: text().notNull(),
    description: text(),
    clientId: uuid(),
    filingId: uuid(),
    noticeId: uuid(),
    engagementId: uuid(),
    parentTaskId: uuid(),
    templateId: uuid(),
    recurringTaskId: uuid(),
    category: text().$type<ServiceCategory>().notNull().default("other"),
    status: text().$type<TaskStatus>().notNull().default("todo"),
    priority: text().$type<TaskPriority>().notNull().default("normal"),
    assigneeMemberId: uuid(),
    reviewerMemberId: uuid(),
    startDate: day(),
    dueDate: day(),
    completedAt: ts(),
    estimateMinutes: integer(),
    billable: boolean().notNull().default(true),
    /** Ordered checklist. Who ticked what and when is kept on each item. */
    checklist: jsonArray<ChecklistItem>(),
    tags: tags(),
    customFields: customFields(),
    metadata: metadata(),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("tasks_firm_id_id_key", t),
    unique("tasks_number_key").on(t.firmId, t.number),
    index("tasks_assignee_idx").on(t.firmId, t.assigneeMemberId, t.status),
    index("tasks_open_due_idx")
      .on(t.firmId, t.dueDate)
      .where(
        sql`${t.status} not in (${closedTaskList}) and ${t.deletedAt} is null`,
      ),
    index("tasks_client_idx").on(t.firmId, t.clientId),
    index("tasks_filing_idx").on(t.firmId, t.filingId),
    tenantFk("tasks_client_fk", t.firmId, t.clientId, clients),
    tenantFk("tasks_filing_fk", t.firmId, t.filingId, filings),
    tenantFk("tasks_notice_fk", t.firmId, t.noticeId, notices),
    tenantFk("tasks_engagement_fk", t.firmId, t.engagementId, engagements),
    tenantFk("tasks_parent_fk", t.firmId, t.parentTaskId, {
      firmId: t.firmId,
      id: t.id,
    }),
    tenantFk("tasks_template_fk", t.firmId, t.templateId, taskTemplates),
    tenantFk("tasks_recurring_fk", t.firmId, t.recurringTaskId, recurringTasks),
    tenantFk("tasks_assignee_fk", t.firmId, t.assigneeMemberId, firmMembers),
    tenantFk("tasks_reviewer_fk", t.firmId, t.reviewerMemberId, firmMembers),
    oneOf("tasks_category_check", t.category, SERVICE_CATEGORIES),
    oneOf("tasks_status_check", t.status, TASK_STATUSES),
    oneOf("tasks_priority_check", t.priority, TASK_PRIORITIES),
    check("tasks_number_check", sql`${t.number} > 0`),
  ],
).enableRLS();

export const timeEntries = pgTable(
  "time_entries",
  {
    id: id(),
    firmId: firmId(),
    memberId: uuid().notNull(),
    clientId: uuid(),
    taskId: uuid(),
    filingId: uuid(),
    engagementId: uuid(),
    workDate: day().notNull(),
    minutes: integer().notNull(),
    /** Set when tracked with the timer. */
    startedAt: ts(),
    endedAt: ts(),
    description: text(),
    billable: boolean().notNull().default(true),
    /** Rates copied at entry time so later rate changes do not rewrite history. */
    billRate: money(),
    costRate: money(),
    status: text().$type<TimeEntryStatus>().notNull().default("draft"),
    approvedByMemberId: uuid(),
    approvedAt: ts(),
    /** Invoice this time was billed on. */
    invoiceId: uuid(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("time_entries_firm_id_id_key", t),
    index("time_entries_member_idx").on(t.firmId, t.memberId, t.workDate),
    index("time_entries_client_idx").on(t.firmId, t.clientId, t.workDate),
    index("time_entries_task_idx").on(t.firmId, t.taskId),
    index("time_entries_unbilled_idx")
      .on(t.firmId, t.clientId)
      .where(
        sql`${t.billable} and ${t.invoiceId} is null and ${t.deletedAt} is null`,
      ),
    tenantFk("time_entries_member_fk", t.firmId, t.memberId, firmMembers),
    tenantFk("time_entries_client_fk", t.firmId, t.clientId, clients),
    tenantFk("time_entries_task_fk", t.firmId, t.taskId, tasks),
    tenantFk("time_entries_filing_fk", t.firmId, t.filingId, filings),
    tenantFk(
      "time_entries_engagement_fk",
      t.firmId,
      t.engagementId,
      engagements,
    ),
    tenantFk(
      "time_entries_approved_by_fk",
      t.firmId,
      t.approvedByMemberId,
      firmMembers,
    ),
    tenantFk("time_entries_invoice_fk", t.firmId, t.invoiceId, invoices),
    oneOf("time_entries_status_check", t.status, TIME_ENTRY_STATUSES),
    check("time_entries_minutes_check", sql`${t.minutes} between 1 and 1440`),
    check(
      "time_entries_timer_check",
      sql`${t.endedAt} is null or ${t.endedAt} >= ${t.startedAt}`,
    ),
  ],
).enableRLS();

/**
 * Comments on any record. `visibility = 'client'` makes a comment part of the conversation with
 * the client in the portal; internal comments never leave the firm.
 */
export const comments = pgTable(
  "comments",
  {
    id: id(),
    firmId: firmId(),
    entityType: text().$type<EntityType>().notNull(),
    entityId: uuid().notNull(),
    parentCommentId: uuid(),
    authorUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    body: text().notNull(),
    /** User IDs mentioned in the body. */
    mentions: jsonArray<string>(),
    visibility: text().$type<CommentVisibility>().notNull().default("internal"),
    editedAt: ts(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("comments_firm_id_id_key", t),
    index("comments_entity_idx").on(
      t.firmId,
      t.entityType,
      t.entityId,
      t.createdAt,
    ),
    tenantFk("comments_parent_fk", t.firmId, t.parentCommentId, {
      firmId: t.firmId,
      id: t.id,
    }),
    oneOf("comments_visibility_check", t.visibility, COMMENT_VISIBILITIES),
  ],
).enableRLS();
