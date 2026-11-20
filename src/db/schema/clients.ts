/**
 * Clients and what hangs off them. One client row is one legal person, i.e. one PAN. Families and
 * business groups (a promoter, the HUF, three companies) are linked through `client_groups`.
 * GSTINs, TAN, CIN and other registrations are separate rows, because a client can hold several
 * (one GSTIN per state) and each one drives its own filings.
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
  tags,
  tenantFk,
  tenantKey,
  timestamps,
  ts,
} from "./columns";
import {
  CLIENT_STATUSES,
  CLIENT_USER_ROLES,
  CLIENT_USER_STATUSES,
  CONSTITUTIONS,
  DSC_CUSTODY,
  REGISTRATION_STATUSES,
  REGISTRATION_TYPES,
  RESIDENTIAL_STATUSES,
  TAX_REGIMES,
  type ClientStatus,
  type ClientUserRole,
  type ClientUserStatus,
  type Constitution,
  type DscCustody,
  type RegistrationStatus,
  type RegistrationType,
  type ResidentialStatus,
  type TaxRegime,
} from "./enums";
import { firmBranches, firmId, firmMembers } from "./firms";
import type { Address, RegistrationAttributes } from "./json";

export const clientGroups = pgTable(
  "client_groups",
  {
    id: id(),
    firmId: firmId(),
    name: text().notNull(),
    description: text(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("client_groups_firm_id_id_key", t),
    uniqueIndex("client_groups_name_key")
      .on(t.firmId, t.name)
      .where(sql`${t.deletedAt} is null`),
  ],
).enableRLS();

export const clients = pgTable(
  "clients",
  {
    id: id(),
    firmId: firmId(),
    /** Short code the firm uses day to day, e.g. "SHAH01". */
    code: text().notNull(),
    displayName: text().notNull(),
    /** Name as per PAN. */
    legalName: text().notNull(),
    constitution: text().$type<Constitution>().notNull(),
    /** Optional only for prospects; required by the app before a client is activated. */
    pan: text(),
    status: text().$type<ClientStatus>().notNull().default("active"),
    groupId: uuid(),
    branchId: uuid(),
    partnerMemberId: uuid(),
    managerMemberId: uuid(),
    /** Date of birth for individuals; date of incorporation or formation otherwise. */
    birthOrIncorporationDate: day(),
    industry: text(),
    natureOfBusiness: text(),
    /** GST state code; place of supply for the firm's invoices to this client. */
    stateCode: text(),
    city: text(),
    address: jsonObject<Address>(),
    onboardedOn: day(),
    disengagedOn: day(),
    disengagementReason: text(),
    referredBy: text(),
    notes: text(),
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
    tenantKey("clients_firm_id_id_key", t),
    uniqueIndex("clients_code_key")
      .on(t.firmId, t.code)
      .where(sql`${t.deletedAt} is null`),
    uniqueIndex("clients_pan_key")
      .on(t.firmId, t.pan)
      .where(sql`${t.pan} is not null and ${t.deletedAt} is null`),
    index("clients_status_idx").on(t.firmId, t.status),
    index("clients_partner_idx").on(t.firmId, t.partnerMemberId),
    index("clients_manager_idx").on(t.firmId, t.managerMemberId),
    index("clients_group_idx").on(t.firmId, t.groupId),
    index("clients_tags_idx").using("gin", t.tags),
    tenantFk("clients_group_fk", t.firmId, t.groupId, clientGroups),
    tenantFk("clients_branch_fk", t.firmId, t.branchId, firmBranches),
    tenantFk("clients_partner_fk", t.firmId, t.partnerMemberId, firmMembers),
    tenantFk("clients_manager_fk", t.firmId, t.managerMemberId, firmMembers),
    oneOf("clients_constitution_check", t.constitution, CONSTITUTIONS),
    oneOf("clients_status_check", t.status, CLIENT_STATUSES),
    matches("clients_pan_check", t.pan, PATTERN.pan),
    matches("clients_state_code_check", t.stateCode, PATTERN.stateCode),
  ],
).enableRLS();

/**
 * Per financial year facts that decide which returns are due and when: residential status, tax
 * regime, tax audit (44AB), transfer pricing (92E), presumptive scheme. Typed columns for what the
 * obligation rules read; everything else in `data`.
 */
export const clientTaxProfiles = pgTable(
  "client_tax_profiles",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    /** Financial year, "2026-27". The assessment year is the next one. */
    fy: text().notNull(),
    residentialStatus: text().$type<ResidentialStatus>(),
    taxRegime: text().$type<TaxRegime>(),
    auditApplicable: boolean(),
    transferPricing: boolean(),
    /** 44AD, 44ADA or 44AE when opted. */
    presumptiveScheme: text(),
    turnover: money(),
    itrForm: text(),
    employer: boolean(),
    data: jsonObject(),
    ...timestamps(),
  },
  (t) => [
    unique("client_tax_profiles_fy_key").on(t.clientId, t.fy),
    tenantFk(
      "client_tax_profiles_client_fk",
      t.firmId,
      t.clientId,
      clients,
    ).onDelete("cascade"),
    matches("client_tax_profiles_fy_check", t.fy, PATTERN.fy),
    oneOf(
      "client_tax_profiles_residential_check",
      t.residentialStatus,
      RESIDENTIAL_STATUSES,
    ),
    oneOf("client_tax_profiles_regime_check", t.taxRegime, TAX_REGIMES),
  ],
).enableRLS();

/**
 * People the firm deals with: directors, partners, accountants, family members. Firm-wide rather
 * than per client, because the same director often sits on several client companies and DIR-3 KYC
 * is filed once per DIN.
 */
export const contacts = pgTable(
  "contacts",
  {
    id: id(),
    firmId: firmId(),
    name: text().notNull(),
    email: text(),
    phone: text(),
    whatsappPhone: text(),
    /** WhatsApp Business messaging needs recorded opt-in. */
    whatsappOptInAt: ts(),
    pan: text(),
    din: text(),
    birthDate: day(),
    /** Set when this person is also a client in their own name. */
    personalClientId: uuid(),
    notes: text(),
    customFields: customFields(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("contacts_firm_id_id_key", t),
    uniqueIndex("contacts_din_key")
      .on(t.firmId, t.din)
      .where(sql`${t.din} is not null and ${t.deletedAt} is null`),
    index("contacts_phone_idx").on(t.firmId, t.phone),
    index("contacts_email_idx").on(t.firmId, t.email),
    tenantFk(
      "contacts_personal_client_fk",
      t.firmId,
      t.personalClientId,
      clients,
    ),
    matches("contacts_pan_check", t.pan, PATTERN.pan),
    matches("contacts_din_check", t.din, PATTERN.din),
    matches("contacts_phone_check", t.phone, PATTERN.phone),
    matches("contacts_whatsapp_check", t.whatsappPhone, PATTERN.phone),
  ],
).enableRLS();

/** How a contact relates to a client, e.g. director of A, accountant at B. */
export const clientContacts = pgTable(
  "client_contacts",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    contactId: uuid().notNull(),
    /** director, partner, proprietor, karta, trustee, authorised_signatory, accounts, family… */
    roles: tags(),
    designation: text(),
    isPrimary: boolean().notNull().default(false),
    receivesReminders: boolean().notNull().default(true),
    receivesInvoices: boolean().notNull().default(false),
    appointedOn: day(),
    ceasedOn: day(),
    metadata: metadata(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("client_contacts_key").on(t.clientId, t.contactId),
    uniqueIndex("client_contacts_one_primary")
      .on(t.clientId)
      .where(sql`${t.isPrimary}`),
    index("client_contacts_contact_idx").on(t.firmId, t.contactId),
    tenantFk(
      "client_contacts_client_fk",
      t.firmId,
      t.clientId,
      clients,
    ).onDelete("cascade"),
    tenantFk(
      "client_contacts_contact_fk",
      t.firmId,
      t.contactId,
      contacts,
    ).onDelete("cascade"),
  ],
).enableRLS();

export const clientRegistrations = pgTable(
  "client_registrations",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    type: text().$type<RegistrationType>().notNull(),
    number: text().notNull(),
    /** For state-level registrations (GSTIN, professional tax). */
    stateCode: text(),
    label: text(),
    status: text().$type<RegistrationStatus>().notNull().default("active"),
    registeredOn: day(),
    cancelledOn: day(),
    /** Principal place of business for this registration. */
    address: jsonObject<Address>(),
    /** Type-specific details: GST scheme history, taxpayer type, ROC code… See `json.ts`. */
    attributes: jsonObject<RegistrationAttributes>(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    tenantKey("client_registrations_firm_id_id_key", t),
    uniqueIndex("client_registrations_number_key")
      .on(t.firmId, t.type, t.number)
      .where(sql`${t.deletedAt} is null`),
    index("client_registrations_client_idx").on(t.firmId, t.clientId),
    tenantFk(
      "client_registrations_client_fk",
      t.firmId,
      t.clientId,
      clients,
    ).onDelete("cascade"),
    oneOf("client_registrations_type_check", t.type, REGISTRATION_TYPES),
    oneOf("client_registrations_status_check", t.status, REGISTRATION_STATUSES),
    matches(
      "client_registrations_state_code_check",
      t.stateCode,
      PATTERN.stateCode,
    ),
    check(
      "client_registrations_gstin_check",
      sql`${t.type} <> 'gstin' or (${t.number} ~ '${sql.raw(PATTERN.gstin)}' and left(${t.number}, 2) = ${t.stateCode})`,
    ),
    check(
      "client_registrations_tan_check",
      sql`${t.type} <> 'tan' or ${t.number} ~ '${sql.raw(PATTERN.tan)}'`,
    ),
    check(
      "client_registrations_cin_check",
      sql`${t.type} <> 'cin' or ${t.number} ~ '${sql.raw(PATTERN.cin)}'`,
    ),
    check(
      "client_registrations_llpin_check",
      sql`${t.type} <> 'llpin' or ${t.number} ~ '${sql.raw(PATTERN.llpin)}'`,
    ),
  ],
).enableRLS();

/**
 * Client portal access. One user can see several clients (a family's individual, HUF and company
 * returns), and the firm controls what each person can do.
 */
export const clientUsers = pgTable(
  "client_users",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: uuid(),
    role: text().$type<ClientUserRole>().notNull().default("member"),
    /** Overrides on top of the role, e.g. ["documents.upload", "invoices.pay"]. */
    permissions: jsonArray<string>(),
    status: text().$type<ClientUserStatus>().notNull().default("invited"),
    invitedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    lastAccessAt: ts(),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    unique("client_users_key").on(t.clientId, t.userId),
    index("client_users_user_idx").on(t.userId),
    tenantFk("client_users_client_fk", t.firmId, t.clientId, clients).onDelete(
      "cascade",
    ),
    tenantFk("client_users_contact_fk", t.firmId, t.contactId, contacts),
    oneOf("client_users_role_check", t.role, CLIENT_USER_ROLES),
    oneOf("client_users_status_check", t.status, CLIENT_USER_STATUSES),
  ],
).enableRLS();

/**
 * Government portal logins the firm keeps for clients (Income Tax, GST, TRACES, MCA, EPFO…).
 * Secrets are encrypted by the app (AES-256-GCM, key held outside the database); `key_version`
 * allows key rotation. Every reveal is written to `activity_log`.
 */
export const clientCredentials = pgTable(
  "client_credentials",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid().notNull(),
    registrationId: uuid(),
    /** income_tax, gst, traces, mca, epfo, esic, professional_tax, icegate, dgft, bank, other */
    portal: text().notNull(),
    label: text(),
    username: text().notNull(),
    secretEnc: text().notNull(),
    notesEnc: text(),
    keyVersion: integer().notNull().default(1),
    lastVerifiedAt: ts(),
    rotatedAt: ts(),
    createdByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("client_credentials_client_idx").on(t.firmId, t.clientId),
    tenantFk(
      "client_credentials_client_fk",
      t.firmId,
      t.clientId,
      clients,
    ).onDelete("cascade"),
    tenantFk(
      "client_credentials_registration_fk",
      t.firmId,
      t.registrationId,
      clientRegistrations,
    ),
  ],
).enableRLS();

/** DSC register: who holds which token, where it is, when it expires. */
export const dscCertificates = pgTable(
  "dsc_certificates",
  {
    id: id(),
    firmId: firmId(),
    clientId: uuid(),
    contactId: uuid(),
    holderName: text().notNull(),
    holderPan: text(),
    /** class_3 for MCA and Income Tax today. */
    certificateClass: text(),
    /** signing, encryption, or both. */
    usage: text(),
    issuer: text(),
    serialNo: text(),
    validFrom: day(),
    validTo: day().notNull(),
    custody: text().$type<DscCustody>().notNull().default("with_firm"),
    /** Cabinet, drawer, or who has it. */
    custodyNote: text(),
    /** Portals where this DSC is registered: mca, income_tax, gst, traces. */
    registeredPortals: tags(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("dsc_certificates_valid_to_idx").on(t.firmId, t.validTo),
    tenantFk("dsc_certificates_client_fk", t.firmId, t.clientId, clients),
    tenantFk("dsc_certificates_contact_fk", t.firmId, t.contactId, contacts),
    oneOf("dsc_certificates_custody_check", t.custody, DSC_CUSTODY),
    matches("dsc_certificates_pan_check", t.holderPan, PATTERN.pan),
  ],
).enableRLS();
