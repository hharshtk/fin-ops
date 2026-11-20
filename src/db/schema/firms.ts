/**
 * Tenancy: the CA firm, its offices, staff and roles. Every firm-owned table carries `firm_id`,
 * and references between firm-owned rows use composite `(firm_id, id)` foreign keys so a row can
 * never point at another firm's data.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { clients, contacts } from "./clients";
import {
  createdAt,
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
  CLIENT_USER_ROLES,
  CONSTITUTIONS,
  FIRM_STATUSES,
  INVITATION_KINDS,
  MEMBER_STATUSES,
  type ClientUserRole,
  type Constitution,
  type FirmStatus,
  type InvitationKind,
  type MemberStatus,
} from "./enums";
import type { Address } from "./json";

/** `firm_id` column for firm-owned tables. Deleting a firm purges its data. */
export function firmId() {
  return uuid()
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" });
}

export const firms = pgTable(
  "firms",
  {
    id: id(),
    name: text().notNull(),
    legalName: text(),
    /** URL handle, e.g. for the client portal. */
    slug: text().notNull(),
    constitution: text().$type<Constitution>(),
    /** ICAI Firm Registration Number. */
    frn: text(),
    pan: text(),
    gstin: text(),
    tan: text(),
    email: text(),
    phone: text(),
    website: text(),
    address: jsonObject<Address>(),
    /** GST state code of the head office; default place of supply for the firm's invoices. */
    stateCode: text(),
    logoUrl: text(),
    status: text().$type<FirmStatus>().notNull().default("trial"),
    plan: text(),
    trialEndsAt: ts(),
    /** Firm-wide preferences: invoice terms, reminder defaults, working days, numbering. */
    settings: jsonObject(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("firms_slug_key").on(t.slug),
    check("firms_slug_check", sql`${t.slug} ~ '^[a-z0-9][a-z0-9-]{1,62}$'`),
    oneOf("firms_constitution_check", t.constitution, CONSTITUTIONS),
    oneOf("firms_status_check", t.status, FIRM_STATUSES),
    matches("firms_pan_check", t.pan, PATTERN.pan),
    matches("firms_gstin_check", t.gstin, PATTERN.gstin),
    matches("firms_tan_check", t.tan, PATTERN.tan),
    matches("firms_state_code_check", t.stateCode, PATTERN.stateCode),
  ],
).enableRLS();

/** Offices. A branch in another state has its own GSTIN and issues its own invoices. */
export const firmBranches = pgTable(
  "firm_branches",
  {
    id: id(),
    firmId: firmId(),
    name: text().notNull(),
    code: text(),
    gstin: text(),
    stateCode: text(),
    address: jsonObject<Address>(),
    phone: text(),
    email: text(),
    isHeadOffice: boolean().notNull().default(false),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("firm_branches_firm_id_id_key", t),
    uniqueIndex("firm_branches_name_key")
      .on(t.firmId, t.name)
      .where(sql`${t.deletedAt} is null`),
    uniqueIndex("firm_branches_one_head_office")
      .on(t.firmId)
      .where(sql`${t.isHeadOffice} and ${t.deletedAt} is null`),
    matches("firm_branches_gstin_check", t.gstin, PATTERN.gstin),
    matches("firm_branches_state_code_check", t.stateCode, PATTERN.stateCode),
  ],
).enableRLS();

/**
 * Roles are data, not code: each firm gets the system roles (Partner, Manager, Senior, Accountant,
 * Article, Admin) and can add its own. `permissions` is a list of permission keys such as
 * "clients.read", "billing.write", "credentials.reveal".
 */
export const roles = pgTable(
  "roles",
  {
    id: id(),
    firmId: firmId(),
    key: text().notNull(),
    name: text().notNull(),
    description: text(),
    permissions: jsonArray<string>(),
    isSystem: boolean().notNull().default(false),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    tenantKey("roles_firm_id_id_key", t),
    unique("roles_key_key").on(t.firmId, t.key),
  ],
).enableRLS();

/** A user's membership of a firm as staff. One person can belong to several firms. */
export const firmMembers = pgTable(
  "firm_members",
  {
    id: id(),
    firmId: firmId(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    roleId: uuid().notNull(),
    branchId: uuid(),
    reportsToMemberId: uuid(),
    /** Display title: Partner, Manager, Article Assistant… Permissions come from the role. */
    designation: text(),
    employeeCode: text(),
    /** For CAs: needed for UDINs and signing reports. */
    icaiMembershipNo: text(),
    status: text().$type<MemberStatus>().notNull().default("active"),
    joinedOn: day(),
    leftOn: day(),
    weeklyCapacityMinutes: integer().notNull().default(2400),
    /** Internal cost, for profitability. */
    costRatePerHour: money(),
    /** Default billing rate for hourly work. */
    billRatePerHour: money(),
    /** Per-firm notification and UI settings. */
    settings: jsonObject(),
    customFields: customFields(),
    /** Articleship registration and period, prior experience, and similar. */
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    tenantKey("firm_members_firm_id_id_key", t),
    unique("firm_members_user_key").on(t.firmId, t.userId),
    index("firm_members_user_idx").on(t.userId),
    tenantFk("firm_members_role_fk", t.firmId, t.roleId, roles),
    tenantFk("firm_members_branch_fk", t.firmId, t.branchId, firmBranches),
    tenantFk("firm_members_reports_to_fk", t.firmId, t.reportsToMemberId, {
      firmId: t.firmId,
      id: t.id,
    }),
    oneOf("firm_members_status_check", t.status, MEMBER_STATUSES),
    matches(
      "firm_members_icai_check",
      t.icaiMembershipNo,
      PATTERN.icaiMembership,
    ),
    check(
      "firm_members_capacity_check",
      sql`${t.weeklyCapacityMinutes} between 0 and 10080`,
    ),
  ],
).enableRLS();

export const teams = pgTable(
  "teams",
  {
    id: id(),
    firmId: firmId(),
    name: text().notNull(),
    description: text(),
    leadMemberId: uuid(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("teams_firm_id_id_key", t),
    tenantFk("teams_lead_fk", t.firmId, t.leadMemberId, firmMembers),
  ],
).enableRLS();

export const teamMembers = pgTable(
  "team_members",
  {
    firmId: firmId(),
    teamId: uuid().notNull(),
    memberId: uuid().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.memberId] }),
    tenantFk("team_members_team_fk", t.firmId, t.teamId, teams).onDelete(
      "cascade",
    ),
    tenantFk(
      "team_members_member_fk",
      t.firmId,
      t.memberId,
      firmMembers,
    ).onDelete("cascade"),
    index("team_members_member_idx").on(t.memberId),
  ],
).enableRLS();

/** Invitations for staff (with a role) and for client portal users (with a client). */
export const invitations = pgTable(
  "invitations",
  {
    id: id(),
    firmId: firmId(),
    kind: text().$type<InvitationKind>().notNull(),
    email: text(),
    phone: text(),
    roleId: uuid(),
    clientId: uuid(),
    contactId: uuid(),
    clientUserRole: text().$type<ClientUserRole>(),
    invitedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    tokenHash: text().notNull(),
    expiresAt: ts().notNull(),
    acceptedAt: ts(),
    acceptedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    revokedAt: ts(),
    message: text(),
    metadata: metadata(),
    createdAt: createdAt(),
  },
  (t) => [
    index("invitations_email_idx").on(t.firmId, t.email),
    uniqueIndex("invitations_token_hash_key").on(t.tokenHash),
    tenantFk("invitations_role_fk", t.firmId, t.roleId, roles),
    tenantFk("invitations_client_fk", t.firmId, t.clientId, clients).onDelete(
      "cascade",
    ),
    tenantFk("invitations_contact_fk", t.firmId, t.contactId, contacts),
    oneOf("invitations_kind_check", t.kind, INVITATION_KINDS),
    oneOf(
      "invitations_client_user_role_check",
      t.clientUserRole,
      CLIENT_USER_ROLES,
    ),
    check(
      "invitations_target_check",
      sql`(${t.kind} = 'firm_member' and ${t.roleId} is not null) or (${t.kind} = 'client_user' and ${t.clientId} is not null)`,
    ),
    check(
      "invitations_address_check",
      sql`coalesce(${t.email}, ${t.phone}) is not null`,
    ),
  ],
).enableRLS();
