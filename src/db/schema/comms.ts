/**
 * Communication: message templates, a log of every message in and out (WhatsApp, email, SMS),
 * automation rules that send reminders, and in-app notifications. Provider names are plain text, so
 * switching WhatsApp or email vendors is a configuration change, not a migration.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { clients, contacts } from "./clients";
import {
  createdAt,
  id,
  jsonArray,
  jsonObject,
  metadata,
  oneOf,
  softDelete,
  tenantFk,
  tenantKey,
  timestamps,
  ts,
} from "./columns";
import {
  MESSAGE_CHANNELS,
  MESSAGE_DIRECTIONS,
  MESSAGE_STATUSES,
  TEMPLATE_APPROVAL_STATUSES,
  type EntityType,
  type MessageChannel,
  type MessageDirection,
  type MessageStatus,
  type TemplateApprovalStatus,
} from "./enums";
import { firmId, firms } from "./firms";
import type { AutomationAction, Schedule } from "./json";

export const messageTemplates = pgTable(
  "message_templates",
  {
    id: id(),
    /** NULL for built-in defaults; a firm's row with the same key overrides it. */
    firmId: uuid().references(() => firms.id, { onDelete: "cascade" }),
    channel: text().$type<MessageChannel>().notNull(),
    /** filing_reminder, document_request, invoice_issued, payment_received… */
    key: text().notNull(),
    name: text().notNull(),
    language: text().notNull().default("en"),
    subject: text(),
    body: text().notNull(),
    /** Placeholder names the body uses. */
    variables: jsonArray<string>(),
    /** Name of the approved template at the WhatsApp provider. */
    providerTemplateId: text(),
    approvalStatus: text().$type<TemplateApprovalStatus>(),
    isActive: boolean().notNull().default(true),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    unique("message_templates_key")
      .on(t.firmId, t.channel, t.key, t.language)
      .nullsNotDistinct(),
    oneOf("message_templates_channel_check", t.channel, MESSAGE_CHANNELS),
    oneOf(
      "message_templates_approval_check",
      t.approvalStatus,
      TEMPLATE_APPROVAL_STATUSES,
    ),
  ],
).enableRLS();

/** Automated reminders and follow-ups, as data. */
export const automationRules = pgTable(
  "automation_rules",
  {
    id: id(),
    firmId: firmId(),
    name: text().notNull(),
    description: text(),
    /** filing.due_in, filing.overdue, invoice.overdue, document_request.pending, dsc.expiring… */
    trigger: text().notNull(),
    conditions: jsonObject(),
    actions: jsonArray<AutomationAction>(),
    schedule: jsonObject<Partial<Schedule>>(),
    isActive: boolean().notNull().default(true),
    lastRunAt: ts(),
    nextRunAt: ts(),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("automation_rules_firm_id_id_key", t),
    index("automation_rules_next_run_idx")
      .on(t.nextRunAt)
      .where(sql`${t.isActive} and ${t.deletedAt} is null`),
  ],
).enableRLS();

/**
 * Every message sent or received. Reminder counts and "last contacted" are read from here rather
 * than kept as counters on other tables.
 */
export const messages = pgTable(
  "messages",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid(),
    contactId: uuid(),
    channel: text().$type<MessageChannel>().notNull(),
    direction: text().$type<MessageDirection>().notNull(),
    templateId: uuid().references(() => messageTemplates.id, {
      onDelete: "set null",
    }),
    fromAddress: text(),
    toAddress: text(),
    subject: text(),
    body: text(),
    variables: jsonObject(),
    /** What the message is about. */
    entityType: text().$type<EntityType>(),
    entityId: uuid(),
    provider: text(),
    providerMessageId: text(),
    status: text().$type<MessageStatus>().notNull().default("queued"),
    errorMessage: text(),
    /** NULL when sent by an automation. */
    sentByUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    automationRuleId: uuid(),
    sentAt: ts(),
    deliveredAt: ts(),
    readAt: ts(),
    failedAt: ts(),
    metadata: metadata(),
    createdAt: createdAt(),
  },
  (t) => [
    tenantKey("messages_firm_id_id_key", t),
    index("messages_client_idx").on(t.firmId, t.clientId, t.createdAt),
    index("messages_entity_idx").on(t.firmId, t.entityType, t.entityId),
    uniqueIndex("messages_provider_key")
      .on(t.provider, t.providerMessageId)
      .where(sql`${t.providerMessageId} is not null`),
    tenantFk("messages_client_fk", t.firmId, t.clientId, clients),
    tenantFk("messages_contact_fk", t.firmId, t.contactId, contacts),
    tenantFk(
      "messages_automation_fk",
      t.firmId,
      t.automationRuleId,
      automationRules,
    ),
    oneOf("messages_channel_check", t.channel, MESSAGE_CHANNELS),
    oneOf("messages_direction_check", t.direction, MESSAGE_DIRECTIONS),
    oneOf("messages_status_check", t.status, MESSAGE_STATUSES),
  ],
).enableRLS();

/** In-app notifications for staff and portal users. */
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    firmId: uuid().references(() => firms.id, { onDelete: "cascade" }),
    /** mention, assigned, review_requested, document_received, due_soon… */
    type: text().notNull(),
    title: text().notNull(),
    body: text(),
    entityType: text().$type<EntityType>(),
    entityId: uuid(),
    actionUrl: text(),
    data: jsonObject(),
    readAt: ts(),
    createdAt: createdAt(),
  },
  (t) => [
    index("notifications_unread_idx")
      .on(t.userId, t.createdAt)
      .where(sql`${t.readAt} is null`),
    index("notifications_user_idx").on(t.userId, t.createdAt),
  ],
).enableRLS();
