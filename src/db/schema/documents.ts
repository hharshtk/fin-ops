/**
 * Documents and requests for them. Files live in object storage (any S3-compatible service, or
 * local disk in development); the database keeps the key, checksum and what the file is about.
 * A document links to any number of records through `document_links`.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { clients } from "./clients";
import {
  createdAt,
  customFields,
  day,
  id,
  jsonArray,
  jsonObject,
  matches,
  metadata,
  oneOf,
  PATTERN,
  softDelete,
  tags,
  tenantFk,
  tenantKey,
  timestamps,
  ts,
} from "./columns";
import { messages } from "./comms";
import { filings } from "./compliance";
import {
  DOCUMENT_REQUEST_STATUSES,
  DOCUMENT_SOURCES,
  DOCUMENT_STATUSES,
  DOCUMENT_VISIBILITIES,
  type DocumentRequestStatus,
  type DocumentSource,
  type DocumentStatus,
  type DocumentVisibility,
  type EntityType,
} from "./enums";
import { firmId } from "./firms";
import type { DocumentRequestItem } from "./json";
import { tasks } from "./work";

export const documentFolders = pgTable(
  "document_folders",
  {
    id: id(),
    firmId: firmId(),
    /** NULL for firm-level folders (templates, internal policies). */
    clientId: uuid(),
    parentId: uuid(),
    name: text().notNull(),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    tenantKey("document_folders_firm_id_id_key", t),
    unique("document_folders_name_key")
      .on(t.firmId, t.clientId, t.parentId, t.name)
      .nullsNotDistinct(),
    tenantFk(
      "document_folders_client_fk",
      t.firmId,
      t.clientId,
      clients,
    ).onDelete("cascade"),
    tenantFk("document_folders_parent_fk", t.firmId, t.parentId, {
      firmId: t.firmId,
      id: t.id,
    }).onDelete("cascade"),
  ],
).enableRLS();

export const documents = pgTable(
  "documents",
  {
    id: id(),
    firmId: firmId(),
    /** NULL while the document sits in the inbox waiting to be classified. */
    clientId: uuid(),
    folderId: uuid(),
    name: text().notNull(),
    originalFilename: text(),
    /**
     * bank_statement, sales_register, purchase_register, form_16, form_26as, ais, invoice,
     * financial_statements, acknowledgement, challan, notice, order, engagement_letter, kyc,
     * working_paper, other. Open text so firms can add their own.
     */
    category: text(),
    fy: text(),
    periodKey: text(),
    source: text().$type<DocumentSource>().notNull().default("upload"),
    status: text().$type<DocumentStatus>().notNull().default("to_classify"),
    visibility: text()
      .$type<DocumentVisibility>()
      .notNull()
      .default("internal"),
    /** "s3", "r2", "gcs", "local"… The bucket and region come from configuration. */
    storageProvider: text().notNull(),
    storageKey: text().notNull(),
    mimeType: text(),
    sizeBytes: bigint({ mode: "number" }),
    checksumSha256: text(),
    pageCount: integer(),
    /** Earlier version this file replaces. */
    supersedesDocumentId: uuid(),
    receivedAt: ts().notNull().defaultNow(),
    /** Phone number or email address it arrived from. */
    receivedFrom: text(),
    /** WhatsApp or email message it arrived in. */
    messageId: uuid(),
    uploadedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    /** Values read from the file by OCR or extraction (Form 16 figures, invoice totals…). */
    extracted: jsonObject(),
    /** End of the statutory retention period; nothing is purged before it. */
    retainUntil: day(),
    tags: tags(),
    customFields: customFields(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("documents_firm_id_id_key", t),
    index("documents_client_idx").on(t.firmId, t.clientId, t.receivedAt),
    index("documents_inbox_idx")
      .on(t.firmId, t.receivedAt)
      .where(sql`${t.status} = 'to_classify' and ${t.deletedAt} is null`),
    index("documents_checksum_idx").on(t.firmId, t.checksumSha256),
    tenantFk("documents_client_fk", t.firmId, t.clientId, clients),
    tenantFk("documents_folder_fk", t.firmId, t.folderId, documentFolders),
    tenantFk("documents_supersedes_fk", t.firmId, t.supersedesDocumentId, {
      firmId: t.firmId,
      id: t.id,
    }),
    tenantFk("documents_message_fk", t.firmId, t.messageId, messages),
    oneOf("documents_source_check", t.source, DOCUMENT_SOURCES),
    oneOf("documents_status_check", t.status, DOCUMENT_STATUSES),
    oneOf("documents_visibility_check", t.visibility, DOCUMENT_VISIBILITIES),
    matches("documents_fy_check", t.fy, PATTERN.fy),
  ],
).enableRLS();

/** Links a document to a filing, task, notice, invoice or any other record. */
export const documentLinks = pgTable(
  "document_links",
  {
    id: id(),
    firmId: firmId(),
    documentId: uuid().notNull(),
    entityType: text().$type<EntityType>().notNull(),
    entityId: uuid().notNull(),
    /** source, working, output, acknowledgement, evidence, attachment. */
    role: text().notNull().default("attachment"),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [
    unique("document_links_key").on(t.documentId, t.entityType, t.entityId),
    index("document_links_entity_idx").on(t.firmId, t.entityType, t.entityId),
    tenantFk(
      "document_links_document_fk",
      t.firmId,
      t.documentId,
      documents,
    ).onDelete("cascade"),
  ],
).enableRLS();

/** A list of documents asked of a client, tracked item by item and shown in the portal. */
export const documentRequests = pgTable(
  "document_requests",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    filingId: uuid(),
    taskId: uuid(),
    title: text().notNull(),
    message: text(),
    items: jsonArray<DocumentRequestItem>(),
    status: text().$type<DocumentRequestStatus>().notNull().default("draft"),
    dueDate: day(),
    requestedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    sentAt: ts(),
    lastRemindedAt: ts(),
    completedAt: ts(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("document_requests_firm_id_id_key", t),
    index("document_requests_client_idx").on(t.firmId, t.clientId, t.status),
    tenantFk("document_requests_client_fk", t.firmId, t.clientId, clients),
    tenantFk("document_requests_filing_fk", t.firmId, t.filingId, filings),
    tenantFk("document_requests_task_fk", t.firmId, t.taskId, tasks),
    oneOf(
      "document_requests_status_check",
      t.status,
      DOCUMENT_REQUEST_STATUSES,
    ),
  ],
).enableRLS();
