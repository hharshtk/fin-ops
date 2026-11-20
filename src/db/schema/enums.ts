/**
 * Allowed values for status and type columns. Stored as `text` with a CHECK constraint, not as
 * Postgres enums: adding a value is a one-line change here plus a generated migration that swaps
 * the constraint, and removing one does not require rebuilding a type.
 *
 * Values are machine slugs. Display labels ("Ready to file") belong to the UI.
 */

export const USER_STATUSES = ["active", "disabled", "locked"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Staff of the product itself (us), not of a CA firm. */
export const PLATFORM_ROLES = ["admin", "support"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const AUTH_TOKEN_PURPOSES = [
  "email_verification",
  "password_reset",
  "magic_link",
  "email_otp",
  "phone_otp",
  "email_change",
] as const;
export type AuthTokenPurpose = (typeof AUTH_TOKEN_PURPOSES)[number];

export const MFA_TYPES = ["totp", "webauthn", "recovery_codes"] as const;
export type MfaType = (typeof MFA_TYPES)[number];

export const FIRM_STATUSES = [
  "trial",
  "active",
  "suspended",
  "closed",
] as const;
export type FirmStatus = (typeof FIRM_STATUSES)[number];

export const MEMBER_STATUSES = [
  "invited",
  "active",
  "suspended",
  "left",
] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const INVITATION_KINDS = ["firm_member", "client_user"] as const;
export type InvitationKind = (typeof INVITATION_KINDS)[number];

/** Legal constitution of a client (or the firm). Mirrors the PAN holder categories. */
export const CONSTITUTIONS = [
  "individual",
  "huf",
  "proprietorship",
  "partnership",
  "llp",
  "private_company",
  "public_company",
  "opc",
  "section_8_company",
  "trust",
  "society",
  "cooperative_society",
  "aop",
  "boi",
  "local_authority",
  "government",
  "artificial_juridical_person",
  "foreign_company",
] as const;
export type Constitution = (typeof CONSTITUTIONS)[number];

export const CLIENT_STATUSES = [
  "prospect",
  "onboarding",
  "active",
  "on_hold",
  "disengaged",
] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_USER_ROLES = ["owner", "member", "viewer"] as const;
export type ClientUserRole = (typeof CLIENT_USER_ROLES)[number];

export const CLIENT_USER_STATUSES = ["invited", "active", "revoked"] as const;
export type ClientUserStatus = (typeof CLIENT_USER_STATUSES)[number];

/** Registrations a client holds besides its PAN (PAN lives on the client row). */
export const REGISTRATION_TYPES = [
  "gstin",
  "tan",
  "cin",
  "llpin",
  "iec",
  "udyam",
  "epfo",
  "esic",
  "professional_tax",
  "lut",
  "shops_establishment",
  "fssai",
  "other",
] as const;
export type RegistrationType = (typeof REGISTRATION_TYPES)[number];

export const REGISTRATION_STATUSES = [
  "active",
  "suspended",
  "cancelled",
  "surrendered",
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const RESIDENTIAL_STATUSES = [
  "resident",
  "rnor",
  "non_resident",
] as const;
export type ResidentialStatus = (typeof RESIDENTIAL_STATUSES)[number];

export const TAX_REGIMES = ["old", "new"] as const;
export type TaxRegime = (typeof TAX_REGIMES)[number];

export const DSC_CUSTODY = ["with_firm", "with_client", "other"] as const;
export type DscCustody = (typeof DSC_CUSTODY)[number];

/** Service lines, also used as the task category. */
export const SERVICE_CATEGORIES = [
  "gst",
  "income_tax",
  "tds",
  "audit",
  "roc",
  "accounting",
  "payroll",
  "advisory",
  "notice",
  "internal",
  "other",
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const ENGAGEMENT_STATUSES = [
  "proposed",
  "active",
  "paused",
  "ended",
] as const;
export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number];

export const FEE_TYPES = [
  "fixed",
  "per_period",
  "per_filing",
  "hourly",
  "retainer",
  "none",
] as const;
export type FeeType = (typeof FEE_TYPES)[number];

export const BILLING_FREQUENCIES = [
  "monthly",
  "quarterly",
  "half_yearly",
  "annual",
  "one_time",
  "on_completion",
] as const;
export type BillingFrequency = (typeof BILLING_FREQUENCIES)[number];

export const REGIMES = [
  "gst",
  "income_tax",
  "tds",
  "tcs",
  "roc",
  "llp",
  "audit",
  "payroll",
  "professional_tax",
  "other",
] as const;
export type Regime = (typeof REGIMES)[number];

export const PERIODICITIES = [
  "monthly",
  "quarterly",
  "half_yearly",
  "annual",
  "one_time",
  "event_based",
] as const;
export type Periodicity = (typeof PERIODICITIES)[number];

/** What a compliance form attaches to: the client's PAN or one of its registrations. */
export const FORM_SUBJECTS = ["pan", ...REGISTRATION_TYPES] as const;
export type FormSubject = (typeof FORM_SUBJECTS)[number];

export const OBLIGATION_STATUSES = ["active", "paused", "ended"] as const;
export type ObligationStatus = (typeof OBLIGATION_STATUSES)[number];

export const OBLIGATION_SOURCES = ["rule", "manual"] as const;
export type ObligationSource = (typeof OBLIGATION_SOURCES)[number];

export const FILING_STATUSES = [
  "not_started",
  "awaiting_data",
  "in_preparation",
  "in_review",
  "ready_to_file",
  "filed",
  "not_applicable",
  "cancelled",
] as const;
export type FilingStatus = (typeof FILING_STATUSES)[number];
/** Filing statuses that no longer need work. */
export const FILING_CLOSED = ["filed", "not_applicable", "cancelled"] as const;

export const NOTICE_STATUSES = [
  "received",
  "under_review",
  "response_in_progress",
  "responded",
  "hearing_scheduled",
  "order_received",
  "appealed",
  "closed",
] as const;
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "waiting_on_client",
  "in_review",
  "done",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_CLOSED = ["done", "cancelled"] as const;

export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TIME_ENTRY_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
] as const;
export type TimeEntryStatus = (typeof TIME_ENTRY_STATUSES)[number];

export const COMMENT_VISIBILITIES = ["internal", "client"] as const;
export type CommentVisibility = (typeof COMMENT_VISIBILITIES)[number];

export const DOCUMENT_SOURCES = [
  "upload",
  "email",
  "whatsapp",
  "client_portal",
  "government_portal",
  "generated",
  "integration",
] as const;
export type DocumentSource = (typeof DOCUMENT_SOURCES)[number];

export const DOCUMENT_STATUSES = [
  "to_classify",
  "classified",
  "query_raised",
  "archived",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_VISIBILITIES = [
  "internal",
  "shared_with_client",
] as const;
export type DocumentVisibility = (typeof DOCUMENT_VISIBILITIES)[number];

export const DOCUMENT_REQUEST_STATUSES = [
  "draft",
  "open",
  "partially_received",
  "completed",
  "cancelled",
] as const;
export type DocumentRequestStatus = (typeof DOCUMENT_REQUEST_STATUSES)[number];

export const INVOICE_TYPES = [
  "tax_invoice",
  "bill_of_supply",
  "proforma",
  "credit_note",
  "debit_note",
] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

/** Lifecycle only. Paid, part paid and overdue are worked out from allocations and dates. */
export const INVOICE_STATUSES = ["draft", "issued", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_MODES = [
  "upi",
  "neft",
  "rtgs",
  "imps",
  "cheque",
  "cash",
  "card",
  "payment_gateway",
  "other",
] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const PAYMENT_STATUSES = [
  "received",
  "bounced",
  "refunded",
  "void",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const MESSAGE_CHANNELS = ["whatsapp", "email", "sms", "in_app"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export const MESSAGE_DIRECTIONS = ["outbound", "inbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
  "received",
] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const TEMPLATE_APPROVAL_STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
] as const;
export type TemplateApprovalStatus =
  (typeof TEMPLATE_APPROVAL_STATUSES)[number];

export const ACTOR_TYPES = [
  "user",
  "client_user",
  "system",
  "integration",
] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export const CUSTOM_FIELD_TYPES = [
  "text",
  "long_text",
  "number",
  "currency",
  "date",
  "boolean",
  "select",
  "multi_select",
  "email",
  "phone",
  "url",
] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export const INTEGRATION_STATUSES = [
  "pending",
  "active",
  "error",
  "disabled",
] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

/**
 * Tables that polymorphic rows (comments, document links, activity, messages, notifications)
 * can point at. Typed in TypeScript only, so new entity types need no migration.
 */
export type EntityType =
  | "firm"
  | "firm_member"
  | "client"
  | "contact"
  | "registration"
  | "engagement"
  | "obligation"
  | "filing"
  | "notice"
  | "task"
  | "time_entry"
  | "document"
  | "document_request"
  | "invoice"
  | "payment"
  | "credential"
  | "dsc"
  | "user";
