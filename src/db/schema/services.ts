/**
 * What the firm sells and to whom. `services` is the firm's catalogue; an `engagement` is one
 * service taken up by one client, with its fee terms. Engagements decide which obligations the firm
 * tracks and what gets billed.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { clients } from "./clients";
import {
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
} from "./columns";
import { documents } from "./documents";
import {
  BILLING_FREQUENCIES,
  ENGAGEMENT_STATUSES,
  FEE_TYPES,
  SERVICE_CATEGORIES,
  type BillingFrequency,
  type EngagementStatus,
  type FeeType,
  type ServiceCategory,
} from "./enums";
import { firmId, firmMembers } from "./firms";

export const services = pgTable(
  "services",
  {
    id: id(),
    firmId: firmId(),
    code: text().notNull(),
    name: text().notNull(),
    category: text().$type<ServiceCategory>().notNull(),
    description: text(),
    /** Service Accounting Code for the invoice line, e.g. 998221. */
    sacCode: text(),
    defaultFee: money(),
    defaultGstRate: rate().notNull().default("18.00"),
    isActive: boolean().notNull().default(true),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    tenantKey("services_firm_id_id_key", t),
    unique("services_code_key").on(t.firmId, t.code),
    oneOf("services_category_check", t.category, SERVICE_CATEGORIES),
    matches("services_sac_check", t.sacCode, PATTERN.sac),
  ],
).enableRLS();

export const engagements = pgTable(
  "engagements",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    serviceId: uuid().notNull(),
    title: text(),
    status: text().$type<EngagementStatus>().notNull().default("active"),
    startDate: day().notNull(),
    endDate: day(),
    /** For year-bound work such as a statutory audit. */
    fy: text(),
    feeType: text().$type<FeeType>().notNull().default("fixed"),
    feeAmount: money(),
    billingFrequency: text().$type<BillingFrequency>(),
    nextBillingOn: day(),
    partnerMemberId: uuid(),
    managerMemberId: uuid(),
    engagementLetterDocumentId: uuid(),
    /** Scope, deliverables, exclusions, payment terms. */
    terms: jsonObject(),
    customFields: customFields(),
    metadata: metadata(),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("engagements_firm_id_id_key", t),
    index("engagements_client_idx").on(t.firmId, t.clientId),
    index("engagements_billing_idx")
      .on(t.firmId, t.nextBillingOn)
      .where(sql`${t.status} = 'active' and ${t.deletedAt} is null`),
    tenantFk("engagements_client_fk", t.firmId, t.clientId, clients),
    tenantFk("engagements_service_fk", t.firmId, t.serviceId, services),
    tenantFk(
      "engagements_partner_fk",
      t.firmId,
      t.partnerMemberId,
      firmMembers,
    ),
    tenantFk(
      "engagements_manager_fk",
      t.firmId,
      t.managerMemberId,
      firmMembers,
    ),
    tenantFk(
      "engagements_letter_fk",
      t.firmId,
      t.engagementLetterDocumentId,
      documents,
    ),
    oneOf("engagements_status_check", t.status, ENGAGEMENT_STATUSES),
    oneOf("engagements_fee_type_check", t.feeType, FEE_TYPES),
    oneOf(
      "engagements_billing_frequency_check",
      t.billingFrequency,
      BILLING_FREQUENCIES,
    ),
    matches("engagements_fy_check", t.fy, PATTERN.fy),
    check(
      "engagements_dates_check",
      sql`${t.endDate} is null or ${t.endDate} >= ${t.startDate}`,
    ),
  ],
).enableRLS();
