/**
 * Cross-cutting tables: the audit trail, firm-defined custom fields, saved list views, third-party
 * connections and per-firm number series.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
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
import {
  createdAt,
  id,
  jsonObject,
  jsonArray,
  matches,
  metadata,
  oneOf,
  PATTERN,
  tenantFk,
  timestamps,
  ts,
} from "./columns";
import {
  ACTOR_TYPES,
  CUSTOM_FIELD_TYPES,
  INTEGRATION_STATUSES,
  type ActorType,
  type CustomFieldType,
  type EntityType,
  type IntegrationStatus,
} from "./enums";
import { firmId, firmMembers, firms } from "./firms";
import type { CustomFieldOption, FieldChange } from "./json";

/**
 * Append-only audit trail: who changed what, when, from where. Covers status changes, edits,
 * deletes, exports and sensitive reads (revealing a portal password). The app's database role
 * should get INSERT and SELECT on this table only.
 */
export const activityLog = pgTable(
  "activity_log",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    /** NULL for events outside any firm (platform administration). */
    firmId: uuid().references(() => firms.id, { onDelete: "cascade" }),
    actorType: text().$type<ActorType>().notNull(),
    actorUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    entityType: text().$type<EntityType>().notNull(),
    entityId: uuid(),
    /** created, updated, status_changed, deleted, restored, viewed_secret, exported… */
    action: text().notNull(),
    /** Field-level diff: { status: { from: "in_review", to: "filed" } }. */
    changes: jsonObject<Record<string, FieldChange>>(),
    /** IP, user agent, session and request IDs. */
    context: jsonObject(),
    createdAt: createdAt(),
  },
  (t) => [
    index("activity_log_entity_idx").on(
      t.firmId,
      t.entityType,
      t.entityId,
      t.createdAt,
    ),
    index("activity_log_firm_idx").on(t.firmId, t.createdAt),
    index("activity_log_actor_idx").on(t.actorUserId, t.createdAt),
    oneOf("activity_log_actor_type_check", t.actorType, ACTOR_TYPES),
  ],
).enableRLS();

/**
 * Fields a firm adds to its own records without a migration. Values are stored in the record's
 * `custom_fields` JSONB under `key`.
 */
export const customFieldDefinitions = pgTable(
  "custom_field_definitions",
  {
    id: id(),
    firmId: firmId(),
    entityType: text().$type<EntityType>().notNull(),
    key: text().notNull(),
    label: text().notNull(),
    fieldType: text().$type<CustomFieldType>().notNull(),
    options: jsonArray<CustomFieldOption>(),
    isRequired: boolean().notNull().default(false),
    helpText: text(),
    position: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    unique("custom_field_definitions_key").on(t.firmId, t.entityType, t.key),
    oneOf(
      "custom_field_definitions_type_check",
      t.fieldType,
      CUSTOM_FIELD_TYPES,
    ),
    matches("custom_field_definitions_key_check", t.key, PATTERN.fieldKey),
  ],
).enableRLS();

/** Saved filters and sort orders for list screens, personal or shared with the firm. */
export const savedViews = pgTable(
  "saved_views",
  {
    id: id(),
    firmId: firmId(),
    /** NULL for a view shared with the whole firm. */
    ownerMemberId: uuid(),
    /** work, compliance, clients, documents, billing… */
    screen: text().notNull(),
    name: text().notNull(),
    /** Same shape as the screen's URL state: filters, sort, columns. */
    query: jsonObject(),
    isDefault: boolean().notNull().default(false),
    position: integer().notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    index("saved_views_screen_idx").on(t.firmId, t.screen),
    tenantFk(
      "saved_views_owner_fk",
      t.firmId,
      t.ownerMemberId,
      firmMembers,
    ).onDelete("cascade"),
  ],
).enableRLS();

/**
 * Connections to outside services: WhatsApp and email providers, storage, accounting software,
 * GSPs, payment gateways. Settings in `config`; keys and tokens encrypted in `secrets_enc`.
 */
export const firmIntegrations = pgTable(
  "firm_integrations",
  {
    id: id(),
    firmId: firmId(),
    /** whatsapp, email, sms, storage, accounting, gsp, payment_gateway, calendar */
    kind: text().notNull(),
    provider: text().notNull(),
    name: text(),
    status: text().$type<IntegrationStatus>().notNull().default("pending"),
    config: jsonObject(),
    secretsEnc: text(),
    keyVersion: integer().notNull().default(1),
    lastSyncedAt: ts(),
    lastError: text(),
    connectedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    index("firm_integrations_kind_idx").on(t.firmId, t.kind),
    oneOf("firm_integrations_status_check", t.status, INTEGRATION_STATUSES),
  ],
).enableRLS();

/**
 * Number series per firm: invoices per FY, credit notes, receipts, task numbers, client codes.
 * Allocate with `UPDATE … SET next_value = next_value + 1 … RETURNING` inside the transaction that
 * uses the number, so concurrent requests never get the same one.
 */
export const numberSequences = pgTable(
  "number_sequences",
  {
    id: id(),
    firmId: firmId(),
    /** invoice, credit_note, receipt, task, client */
    key: text().notNull(),
    /** Partition of the series, e.g. the FY "2026-27" or a branch ID. Empty for one series. */
    scope: text().notNull().default(""),
    prefix: text().notNull().default(""),
    nextValue: integer().notNull().default(1),
    padding: integer().notNull().default(4),
    /** e.g. "{prefix}/{fy}/{seq}". */
    format: text(),
    ...timestamps(),
  },
  (t) => [
    unique("number_sequences_key").on(t.firmId, t.key, t.scope),
    check("number_sequences_next_check", sql`${t.nextValue} > 0`),
  ],
).enableRLS();
