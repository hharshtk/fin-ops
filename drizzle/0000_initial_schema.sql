CREATE TABLE "auth_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"identifier" text,
	"event" text NOT NULL,
	"provider" text,
	"ip" "inet",
	"user_agent" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"email" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"password_hash" text,
	"password_changed_at" timestamp with time zone,
	"access_token_enc" text,
	"refresh_token_enc" text,
	"token_expires_at" timestamp with time zone,
	"scope" text,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_used_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_identities_provider_account_key" UNIQUE("provider","provider_account_id"),
	CONSTRAINT "auth_identities_password_hash_check" CHECK (("auth_identities"."provider" = 'password') = ("auth_identities"."password_hash" is not null))
);
--> statement-breakpoint
ALTER TABLE "auth_identities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"identity_id" uuid,
	"active_firm_id" uuid,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"mfa_verified_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"purpose" text NOT NULL,
	"identifier" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_tokens_purpose_check" CHECK ("auth_tokens"."purpose" in ('email_verification', 'password_reset', 'magic_link', 'email_otp', 'phone_otp', 'email_change'))
);
--> statement-breakpoint
ALTER TABLE "auth_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mfa_factors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"label" text,
	"secret_enc" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verified_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mfa_factors_type_check" CHECK ("mfa_factors"."type" in ('totp', 'webauthn', 'recovery_codes'))
);
--> statement-breakpoint
ALTER TABLE "mfa_factors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"email_verified_at" timestamp with time zone,
	"phone" text,
	"phone_verified_at" timestamp with time zone,
	"username" text,
	"name" text NOT NULL,
	"avatar_url" text,
	"locale" text DEFAULT 'en-IN' NOT NULL,
	"time_zone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"platform_role" text,
	"last_login_at" timestamp with time zone,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_lowercase_check" CHECK ("users"."email" = lower("users"."email")),
	CONSTRAINT "users_username_lowercase_check" CHECK ("users"."username" = lower("users"."username")),
	CONSTRAINT "users_login_handle_check" CHECK (coalesce("users"."email", "users"."phone", "users"."username") is not null),
	CONSTRAINT "users_phone_check" CHECK ("users"."phone" ~ '^\+[1-9][0-9]{6,14}$'),
	CONSTRAINT "users_status_check" CHECK ("users"."status" in ('active', 'disabled', 'locked')),
	CONSTRAINT "users_platform_role_check" CHECK ("users"."platform_role" in ('admin', 'support'))
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "disbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"spent_on" date NOT NULL,
	"description" text NOT NULL,
	"category" text,
	"amount" numeric(15, 2) NOT NULL,
	"paid_by_member_id" uuid,
	"receipt_document_id" uuid,
	"filing_id" uuid,
	"billable" boolean DEFAULT true NOT NULL,
	"invoice_line_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "disbursements_amount_check" CHECK ("disbursements"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "disbursements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"service_id" uuid,
	"engagement_id" uuid,
	"filing_id" uuid,
	"description" text NOT NULL,
	"sac_code" text,
	"quantity" numeric(12, 3) DEFAULT '1' NOT NULL,
	"rate" numeric(15, 2) NOT NULL,
	"discount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"taxable_amount" numeric(15, 2) NOT NULL,
	"gst_rate" numeric(5, 2) DEFAULT '18.00' NOT NULL,
	"cgst" numeric(15, 2) DEFAULT '0' NOT NULL,
	"sgst" numeric(15, 2) DEFAULT '0' NOT NULL,
	"igst" numeric(15, 2) DEFAULT '0' NOT NULL,
	"cess" numeric(15, 2) DEFAULT '0' NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"is_reimbursement" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "invoice_lines_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "invoice_lines_position_key" UNIQUE("invoice_id","position"),
	CONSTRAINT "invoice_lines_sac_check" CHECK ("invoice_lines"."sac_code" ~ '^99[0-9]{4}$')
);
--> statement-breakpoint
ALTER TABLE "invoice_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"branch_id" uuid,
	"client_id" uuid NOT NULL,
	"type" text DEFAULT 'tax_invoice' NOT NULL,
	"number" text,
	"fy" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"issue_date" date,
	"due_date" date,
	"place_of_supply" text,
	"reverse_charge" boolean DEFAULT false NOT NULL,
	"supplier" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recipient" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"subtotal" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discount_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"taxable_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"cgst_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"sgst_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"igst_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"cess_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"round_off" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"original_invoice_id" uuid,
	"einvoice" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text,
	"terms" text,
	"issued_at" timestamp with time zone,
	"issued_by_user_id" uuid,
	"sent_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"pdf_document_id" uuid,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "invoices_type_check" CHECK ("invoices"."type" in ('tax_invoice', 'bill_of_supply', 'proforma', 'credit_note', 'debit_note')),
	CONSTRAINT "invoices_status_check" CHECK ("invoices"."status" in ('draft', 'issued', 'cancelled')),
	CONSTRAINT "invoices_fy_check" CHECK ("invoices"."fy" ~ '^[0-9]{4}-[0-9]{2}$'),
	CONSTRAINT "invoices_place_of_supply_check" CHECK ("invoices"."place_of_supply" ~ '^[0-9]{2}$'),
	CONSTRAINT "invoices_issued_check" CHECK ("invoices"."status" = 'draft' or ("invoices"."number" is not null and "invoices"."issue_date" is not null)),
	CONSTRAINT "invoices_note_check" CHECK ("invoices"."type" not in ('credit_note', 'debit_note') or "invoices"."original_invoice_id" is not null)
);
--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_allocations_key" UNIQUE("payment_id","invoice_id"),
	CONSTRAINT "payment_allocations_amount_check" CHECK ("payment_allocations"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"receipt_number" text,
	"received_on" date NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"tds_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"tds_section" text,
	"mode" text NOT NULL,
	"reference" text,
	"deposited_to" text,
	"cheque_date" date,
	"status" text DEFAULT 'received' NOT NULL,
	"notes" text,
	"recorded_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "payments_mode_check" CHECK ("payments"."mode" in ('upi', 'neft', 'rtgs', 'imps', 'cheque', 'cash', 'card', 'payment_gateway', 'other')),
	CONSTRAINT "payments_status_check" CHECK ("payments"."status" in ('received', 'bounced', 'refunded', 'void')),
	CONSTRAINT "payments_amounts_check" CHECK ("payments"."amount" >= 0 and "payments"."tds_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"roles" text[] DEFAULT '{}'::text[] NOT NULL,
	"designation" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"receives_reminders" boolean DEFAULT true NOT NULL,
	"receives_invoices" boolean DEFAULT false NOT NULL,
	"appointed_on" date,
	"ceased_on" date,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_contacts_key" UNIQUE("client_id","contact_id")
);
--> statement-breakpoint
ALTER TABLE "client_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"registration_id" uuid,
	"portal" text NOT NULL,
	"label" text,
	"username" text NOT NULL,
	"secret_enc" text NOT NULL,
	"notes_enc" text,
	"key_version" integer DEFAULT 1 NOT NULL,
	"last_verified_at" timestamp with time zone,
	"rotated_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "client_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "client_groups_firm_id_id_key" UNIQUE("firm_id","id")
);
--> statement-breakpoint
ALTER TABLE "client_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"type" text NOT NULL,
	"number" text NOT NULL,
	"state_code" text,
	"label" text,
	"status" text DEFAULT 'active' NOT NULL,
	"registered_on" date,
	"cancelled_on" date,
	"address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "client_registrations_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "client_registrations_type_check" CHECK ("client_registrations"."type" in ('gstin', 'tan', 'cin', 'llpin', 'iec', 'udyam', 'epfo', 'esic', 'professional_tax', 'lut', 'shops_establishment', 'fssai', 'other')),
	CONSTRAINT "client_registrations_status_check" CHECK ("client_registrations"."status" in ('active', 'suspended', 'cancelled', 'surrendered')),
	CONSTRAINT "client_registrations_state_code_check" CHECK ("client_registrations"."state_code" ~ '^[0-9]{2}$'),
	CONSTRAINT "client_registrations_gstin_check" CHECK ("client_registrations"."type" <> 'gstin' or ("client_registrations"."number" ~ '^[0-9]{2}[A-Z0-9]{10}[0-9A-Z][A-Z][0-9A-Z]$' and left("client_registrations"."number", 2) = "client_registrations"."state_code")),
	CONSTRAINT "client_registrations_tan_check" CHECK ("client_registrations"."type" <> 'tan' or "client_registrations"."number" ~ '^[A-Z]{4}[0-9]{5}[A-Z]$'),
	CONSTRAINT "client_registrations_cin_check" CHECK ("client_registrations"."type" <> 'cin' or "client_registrations"."number" ~ '^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$'),
	CONSTRAINT "client_registrations_llpin_check" CHECK ("client_registrations"."type" <> 'llpin' or "client_registrations"."number" ~ '^[A-Z]{3}-[0-9]{4}$')
);
--> statement-breakpoint
ALTER TABLE "client_registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_tax_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"fy" text NOT NULL,
	"residential_status" text,
	"tax_regime" text,
	"audit_applicable" boolean,
	"transfer_pricing" boolean,
	"presumptive_scheme" text,
	"turnover" numeric(15, 2),
	"itr_form" text,
	"employer" boolean,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_tax_profiles_fy_key" UNIQUE("client_id","fy"),
	CONSTRAINT "client_tax_profiles_fy_check" CHECK ("client_tax_profiles"."fy" ~ '^[0-9]{4}-[0-9]{2}$'),
	CONSTRAINT "client_tax_profiles_residential_check" CHECK ("client_tax_profiles"."residential_status" in ('resident', 'rnor', 'non_resident')),
	CONSTRAINT "client_tax_profiles_regime_check" CHECK ("client_tax_profiles"."tax_regime" in ('old', 'new'))
);
--> statement-breakpoint
ALTER TABLE "client_tax_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_id" uuid,
	"role" text DEFAULT 'member' NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'invited' NOT NULL,
	"invited_by_user_id" uuid,
	"last_access_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_users_key" UNIQUE("client_id","user_id"),
	CONSTRAINT "client_users_role_check" CHECK ("client_users"."role" in ('owner', 'member', 'viewer')),
	CONSTRAINT "client_users_status_check" CHECK ("client_users"."status" in ('invited', 'active', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "client_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"legal_name" text NOT NULL,
	"constitution" text NOT NULL,
	"pan" text,
	"status" text DEFAULT 'active' NOT NULL,
	"group_id" uuid,
	"branch_id" uuid,
	"partner_member_id" uuid,
	"manager_member_id" uuid,
	"birth_or_incorporation_date" date,
	"industry" text,
	"nature_of_business" text,
	"state_code" text,
	"city" text,
	"address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"onboarded_on" date,
	"disengaged_on" date,
	"disengagement_reason" text,
	"referred_by" text,
	"notes" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "clients_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "clients_constitution_check" CHECK ("clients"."constitution" in ('individual', 'huf', 'proprietorship', 'partnership', 'llp', 'private_company', 'public_company', 'opc', 'section_8_company', 'trust', 'society', 'cooperative_society', 'aop', 'boi', 'local_authority', 'government', 'artificial_juridical_person', 'foreign_company')),
	CONSTRAINT "clients_status_check" CHECK ("clients"."status" in ('prospect', 'onboarding', 'active', 'on_hold', 'disengaged')),
	CONSTRAINT "clients_pan_check" CHECK ("clients"."pan" ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
	CONSTRAINT "clients_state_code_check" CHECK ("clients"."state_code" ~ '^[0-9]{2}$')
);
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"whatsapp_phone" text,
	"whatsapp_opt_in_at" timestamp with time zone,
	"pan" text,
	"din" text,
	"birth_date" date,
	"personal_client_id" uuid,
	"notes" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "contacts_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "contacts_pan_check" CHECK ("contacts"."pan" ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
	CONSTRAINT "contacts_din_check" CHECK ("contacts"."din" ~ '^[0-9]{8}$'),
	CONSTRAINT "contacts_phone_check" CHECK ("contacts"."phone" ~ '^\+[1-9][0-9]{6,14}$'),
	CONSTRAINT "contacts_whatsapp_check" CHECK ("contacts"."whatsapp_phone" ~ '^\+[1-9][0-9]{6,14}$')
);
--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dsc_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid,
	"contact_id" uuid,
	"holder_name" text NOT NULL,
	"holder_pan" text,
	"certificate_class" text,
	"usage" text,
	"issuer" text,
	"serial_no" text,
	"valid_from" date,
	"valid_to" date NOT NULL,
	"custody" text DEFAULT 'with_firm' NOT NULL,
	"custody_note" text,
	"registered_portals" text[] DEFAULT '{}'::text[] NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "dsc_certificates_custody_check" CHECK ("dsc_certificates"."custody" in ('with_firm', 'with_client', 'other')),
	CONSTRAINT "dsc_certificates_pan_check" CHECK ("dsc_certificates"."holder_pan" ~ '^[A-Z]{5}[0-9]{4}[A-Z]$')
);
--> statement-breakpoint
ALTER TABLE "dsc_certificates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger" text NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"schedule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "automation_rules_firm_id_id_key" UNIQUE("firm_id","id")
);
--> statement-breakpoint
ALTER TABLE "automation_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid,
	"channel" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provider_template_id" text,
	"approval_status" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_templates_key" UNIQUE NULLS NOT DISTINCT("firm_id","channel","key","language"),
	CONSTRAINT "message_templates_channel_check" CHECK ("message_templates"."channel" in ('whatsapp', 'email', 'sms', 'in_app')),
	CONSTRAINT "message_templates_approval_check" CHECK ("message_templates"."approval_status" in ('draft', 'pending', 'approved', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "message_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid,
	"contact_id" uuid,
	"channel" text NOT NULL,
	"direction" text NOT NULL,
	"template_id" uuid,
	"from_address" text,
	"to_address" text,
	"subject" text,
	"body" text,
	"variables" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"provider" text,
	"provider_message_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"error_message" text,
	"sent_by_user_id" uuid,
	"automation_rule_id" uuid,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "messages_channel_check" CHECK ("messages"."channel" in ('whatsapp', 'email', 'sms', 'in_app')),
	CONSTRAINT "messages_direction_check" CHECK ("messages"."direction" in ('outbound', 'inbound')),
	CONSTRAINT "messages_status_check" CHECK ("messages"."status" in ('queued', 'sent', 'delivered', 'read', 'failed', 'received'))
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"firm_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"entity_type" text,
	"entity_id" uuid,
	"action_url" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "compliance_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"regime" text NOT NULL,
	"authority" text,
	"periodicity" text NOT NULL,
	"subject" text NOT NULL,
	"portal" text,
	"description" text,
	"applicability" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"due_date_rule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_forms_regime_check" CHECK ("compliance_forms"."regime" in ('gst', 'income_tax', 'tds', 'tcs', 'roc', 'llp', 'audit', 'payroll', 'professional_tax', 'other')),
	CONSTRAINT "compliance_forms_periodicity_check" CHECK ("compliance_forms"."periodicity" in ('monthly', 'quarterly', 'half_yearly', 'annual', 'one_time', 'event_based')),
	CONSTRAINT "compliance_forms_subject_check" CHECK ("compliance_forms"."subject" in ('pan', 'gstin', 'tan', 'cin', 'llpin', 'iec', 'udyam', 'epfo', 'esic', 'professional_tax', 'lut', 'shops_establishment', 'fssai', 'other'))
);
--> statement-breakpoint
ALTER TABLE "compliance_forms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "compliance_obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"registration_id" uuid,
	"form_id" uuid NOT NULL,
	"engagement_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"source" text DEFAULT 'rule' NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"due_date_variant" text,
	"default_assignee_member_id" uuid,
	"default_reviewer_member_id" uuid,
	"internal_lead_days" integer,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_obligations_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "compliance_obligations_key" UNIQUE NULLS NOT DISTINCT("firm_id","client_id","registration_id","form_id"),
	CONSTRAINT "compliance_obligations_status_check" CHECK ("compliance_obligations"."status" in ('active', 'paused', 'ended')),
	CONSTRAINT "compliance_obligations_source_check" CHECK ("compliance_obligations"."source" in ('rule', 'manual')),
	CONSTRAINT "compliance_obligations_dates_check" CHECK ("compliance_obligations"."ends_on" is null or "compliance_obligations"."ends_on" >= "compliance_obligations"."starts_on")
);
--> statement-breakpoint
ALTER TABLE "compliance_obligations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "filings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"registration_id" uuid,
	"obligation_id" uuid,
	"form_id" uuid NOT NULL,
	"engagement_id" uuid,
	"period_key" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"fy" text NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"revises_filing_id" uuid,
	"statutory_due_date_id" uuid,
	"due_date" date NOT NULL,
	"due_date_overridden" boolean DEFAULT false NOT NULL,
	"internal_due_date" date,
	"status" text DEFAULT 'not_started' NOT NULL,
	"assignee_member_id" uuid,
	"reviewer_member_id" uuid,
	"reviewed_by_member_id" uuid,
	"reviewed_at" timestamp with time zone,
	"filed_by_member_id" uuid,
	"filed_on" date,
	"acknowledgement_no" text,
	"udin" text,
	"is_nil" boolean DEFAULT false NOT NULL,
	"late_fee" numeric(15, 2),
	"interest" numeric(15, 2),
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "filings_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "filings_period_key" UNIQUE NULLS NOT DISTINCT("firm_id","client_id","registration_id","form_id","period_key","revision"),
	CONSTRAINT "filings_status_check" CHECK ("filings"."status" in ('not_started', 'awaiting_data', 'in_preparation', 'in_review', 'ready_to_file', 'filed', 'not_applicable', 'cancelled')),
	CONSTRAINT "filings_fy_check" CHECK ("filings"."fy" ~ '^[0-9]{4}-[0-9]{2}$'),
	CONSTRAINT "filings_revision_check" CHECK ("filings"."revision" >= 0),
	CONSTRAINT "filings_period_check" CHECK ("filings"."period_end" >= "filings"."period_start"),
	CONSTRAINT "filings_filed_check" CHECK ("filings"."status" <> 'filed' or "filings"."filed_on" is not null)
);
--> statement-breakpoint
ALTER TABLE "filings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"registration_id" uuid,
	"filing_id" uuid,
	"regime" text NOT NULL,
	"authority" text,
	"notice_type" text NOT NULL,
	"reference_no" text,
	"issued_on" date,
	"received_on" date,
	"response_due_on" date,
	"fy" text,
	"period_key" text,
	"amount_demanded" numeric(15, 2),
	"status" text DEFAULT 'received' NOT NULL,
	"assignee_member_id" uuid,
	"reviewer_member_id" uuid,
	"hearings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"outcome" text,
	"closed_on" date,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "notices_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "notices_regime_check" CHECK ("notices"."regime" in ('gst', 'income_tax', 'tds', 'tcs', 'roc', 'llp', 'audit', 'payroll', 'professional_tax', 'other')),
	CONSTRAINT "notices_status_check" CHECK ("notices"."status" in ('received', 'under_review', 'response_in_progress', 'responded', 'hearing_scheduled', 'order_received', 'appealed', 'closed')),
	CONSTRAINT "notices_fy_check" CHECK ("notices"."fy" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
ALTER TABLE "notices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "statutory_due_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"period_key" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"state_codes" text[],
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"due_date" date NOT NULL,
	"original_due_date" date NOT NULL,
	"extensions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "statutory_due_dates_key" UNIQUE("form_id","period_key","variant"),
	CONSTRAINT "statutory_due_dates_period_check" CHECK ("statutory_due_dates"."period_end" >= "statutory_due_dates"."period_start")
);
--> statement-breakpoint
ALTER TABLE "statutory_due_dates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid,
	"parent_id" uuid,
	"name" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_folders_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "document_folders_name_key" UNIQUE NULLS NOT DISTINCT("firm_id","client_id","parent_id","name")
);
--> statement-breakpoint
ALTER TABLE "document_folders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"role" text DEFAULT 'attachment' NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_links_key" UNIQUE("document_id","entity_type","entity_id")
);
--> statement-breakpoint
ALTER TABLE "document_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"filing_id" uuid,
	"task_id" uuid,
	"title" text NOT NULL,
	"message" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"due_date" date,
	"requested_by_user_id" uuid,
	"sent_at" timestamp with time zone,
	"last_reminded_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "document_requests_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "document_requests_status_check" CHECK ("document_requests"."status" in ('draft', 'open', 'partially_received', 'completed', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "document_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid,
	"folder_id" uuid,
	"name" text NOT NULL,
	"original_filename" text,
	"category" text,
	"fy" text,
	"period_key" text,
	"source" text DEFAULT 'upload' NOT NULL,
	"status" text DEFAULT 'to_classify' NOT NULL,
	"visibility" text DEFAULT 'internal' NOT NULL,
	"storage_provider" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text,
	"size_bytes" bigint,
	"checksum_sha256" text,
	"page_count" integer,
	"supersedes_document_id" uuid,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"received_from" text,
	"message_id" uuid,
	"uploaded_by_user_id" uuid,
	"extracted" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"retain_until" date,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "documents_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "documents_source_check" CHECK ("documents"."source" in ('upload', 'email', 'whatsapp', 'client_portal', 'government_portal', 'generated', 'integration')),
	CONSTRAINT "documents_status_check" CHECK ("documents"."status" in ('to_classify', 'classified', 'query_raised', 'archived')),
	CONSTRAINT "documents_visibility_check" CHECK ("documents"."visibility" in ('internal', 'shared_with_client')),
	CONSTRAINT "documents_fy_check" CHECK ("documents"."fy" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "firm_branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"gstin" text,
	"state_code" text,
	"address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"phone" text,
	"email" text,
	"is_head_office" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "firm_branches_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "firm_branches_gstin_check" CHECK ("firm_branches"."gstin" ~ '^[0-9]{2}[A-Z0-9]{10}[0-9A-Z][A-Z][0-9A-Z]$'),
	CONSTRAINT "firm_branches_state_code_check" CHECK ("firm_branches"."state_code" ~ '^[0-9]{2}$')
);
--> statement-breakpoint
ALTER TABLE "firm_branches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "firm_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"branch_id" uuid,
	"reports_to_member_id" uuid,
	"designation" text,
	"employee_code" text,
	"icai_membership_no" text,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_on" date,
	"left_on" date,
	"weekly_capacity_minutes" integer DEFAULT 2400 NOT NULL,
	"cost_rate_per_hour" numeric(15, 2),
	"bill_rate_per_hour" numeric(15, 2),
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "firm_members_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "firm_members_user_key" UNIQUE("firm_id","user_id"),
	CONSTRAINT "firm_members_status_check" CHECK ("firm_members"."status" in ('invited', 'active', 'suspended', 'left')),
	CONSTRAINT "firm_members_icai_check" CHECK ("firm_members"."icai_membership_no" ~ '^[0-9]{6}$'),
	CONSTRAINT "firm_members_capacity_check" CHECK ("firm_members"."weekly_capacity_minutes" between 0 and 10080)
);
--> statement-breakpoint
ALTER TABLE "firm_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "firms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"slug" text NOT NULL,
	"constitution" text,
	"frn" text,
	"pan" text,
	"gstin" text,
	"tan" text,
	"email" text,
	"phone" text,
	"website" text,
	"address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"state_code" text,
	"logo_url" text,
	"status" text DEFAULT 'trial' NOT NULL,
	"plan" text,
	"trial_ends_at" timestamp with time zone,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "firms_slug_check" CHECK ("firms"."slug" ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
	CONSTRAINT "firms_constitution_check" CHECK ("firms"."constitution" in ('individual', 'huf', 'proprietorship', 'partnership', 'llp', 'private_company', 'public_company', 'opc', 'section_8_company', 'trust', 'society', 'cooperative_society', 'aop', 'boi', 'local_authority', 'government', 'artificial_juridical_person', 'foreign_company')),
	CONSTRAINT "firms_status_check" CHECK ("firms"."status" in ('trial', 'active', 'suspended', 'closed')),
	CONSTRAINT "firms_pan_check" CHECK ("firms"."pan" ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
	CONSTRAINT "firms_gstin_check" CHECK ("firms"."gstin" ~ '^[0-9]{2}[A-Z0-9]{10}[0-9A-Z][A-Z][0-9A-Z]$'),
	CONSTRAINT "firms_tan_check" CHECK ("firms"."tan" ~ '^[A-Z]{4}[0-9]{5}[A-Z]$'),
	CONSTRAINT "firms_state_code_check" CHECK ("firms"."state_code" ~ '^[0-9]{2}$')
);
--> statement-breakpoint
ALTER TABLE "firms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"email" text,
	"phone" text,
	"role_id" uuid,
	"client_id" uuid,
	"contact_id" uuid,
	"client_user_role" text,
	"invited_by_user_id" uuid,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by_user_id" uuid,
	"revoked_at" timestamp with time zone,
	"message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_kind_check" CHECK ("invitations"."kind" in ('firm_member', 'client_user')),
	CONSTRAINT "invitations_client_user_role_check" CHECK ("invitations"."client_user_role" in ('owner', 'member', 'viewer')),
	CONSTRAINT "invitations_target_check" CHECK (("invitations"."kind" = 'firm_member' and "invitations"."role_id" is not null) or ("invitations"."kind" = 'client_user' and "invitations"."client_id" is not null)),
	CONSTRAINT "invitations_address_check" CHECK (coalesce("invitations"."email", "invitations"."phone") is not null)
);
--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "roles_key_key" UNIQUE("firm_id","key")
);
--> statement-breakpoint
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "team_members" (
	"firm_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_team_id_member_id_pk" PRIMARY KEY("team_id","member_id")
);
--> statement-breakpoint
ALTER TABLE "team_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"lead_member_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "teams_firm_id_id_key" UNIQUE("firm_id","id")
);
--> statement-breakpoint
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"firm_id" uuid,
	"actor_type" text NOT NULL,
	"actor_user_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"action" text NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_log_actor_type_check" CHECK ("activity_log"."actor_type" in ('user', 'client_user', 'system', 'integration'))
);
--> statement-breakpoint
ALTER TABLE "activity_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "custom_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"field_type" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"help_text" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_field_definitions_key" UNIQUE("firm_id","entity_type","key"),
	CONSTRAINT "custom_field_definitions_type_check" CHECK ("custom_field_definitions"."field_type" in ('text', 'long_text', 'number', 'currency', 'date', 'boolean', 'select', 'multi_select', 'email', 'phone', 'url')),
	CONSTRAINT "custom_field_definitions_key_check" CHECK ("custom_field_definitions"."key" ~ '^[a-z][a-z0-9_]{0,62}$')
);
--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "firm_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"provider" text NOT NULL,
	"name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"secrets_enc" text,
	"key_version" integer DEFAULT 1 NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"connected_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "firm_integrations_status_check" CHECK ("firm_integrations"."status" in ('pending', 'active', 'error', 'disabled'))
);
--> statement-breakpoint
ALTER TABLE "firm_integrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "number_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"key" text NOT NULL,
	"scope" text DEFAULT '' NOT NULL,
	"prefix" text DEFAULT '' NOT NULL,
	"next_value" integer DEFAULT 1 NOT NULL,
	"padding" integer DEFAULT 4 NOT NULL,
	"format" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "number_sequences_key" UNIQUE("firm_id","key","scope"),
	CONSTRAINT "number_sequences_next_check" CHECK ("number_sequences"."next_value" > 0)
);
--> statement-breakpoint
ALTER TABLE "number_sequences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "saved_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"owner_member_id" uuid,
	"screen" text NOT NULL,
	"name" text NOT NULL,
	"query" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_views" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "engagements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"title" text,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"fy" text,
	"fee_type" text DEFAULT 'fixed' NOT NULL,
	"fee_amount" numeric(15, 2),
	"billing_frequency" text,
	"next_billing_on" date,
	"partner_member_id" uuid,
	"manager_member_id" uuid,
	"engagement_letter_document_id" uuid,
	"terms" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "engagements_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "engagements_status_check" CHECK ("engagements"."status" in ('proposed', 'active', 'paused', 'ended')),
	CONSTRAINT "engagements_fee_type_check" CHECK ("engagements"."fee_type" in ('fixed', 'per_period', 'per_filing', 'hourly', 'retainer', 'none')),
	CONSTRAINT "engagements_billing_frequency_check" CHECK ("engagements"."billing_frequency" in ('monthly', 'quarterly', 'half_yearly', 'annual', 'one_time', 'on_completion')),
	CONSTRAINT "engagements_fy_check" CHECK ("engagements"."fy" ~ '^[0-9]{4}-[0-9]{2}$'),
	CONSTRAINT "engagements_dates_check" CHECK ("engagements"."end_date" is null or "engagements"."end_date" >= "engagements"."start_date")
);
--> statement-breakpoint
ALTER TABLE "engagements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"sac_code" text,
	"default_fee" numeric(15, 2),
	"default_gst_rate" numeric(5, 2) DEFAULT '18.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "services_code_key" UNIQUE("firm_id","code"),
	CONSTRAINT "services_category_check" CHECK ("services"."category" in ('gst', 'income_tax', 'tds', 'audit', 'roc', 'accounting', 'payroll', 'advisory', 'notice', 'internal', 'other')),
	CONSTRAINT "services_sac_check" CHECK ("services"."sac_code" ~ '^99[0-9]{4}$')
);
--> statement-breakpoint
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"author_user_id" uuid,
	"body" text NOT NULL,
	"mentions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" text DEFAULT 'internal' NOT NULL,
	"edited_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "comments_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "comments_visibility_check" CHECK ("comments"."visibility" in ('internal', 'client'))
);
--> statement-breakpoint
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "recurring_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"template_id" uuid,
	"client_id" uuid,
	"engagement_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"schedule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"assignee_member_id" uuid,
	"reviewer_member_id" uuid,
	"next_run_on" date,
	"last_run_on" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "recurring_tasks_firm_id_id_key" UNIQUE("firm_id","id")
);
--> statement-breakpoint
ALTER TABLE "recurring_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"form_id" uuid,
	"service_id" uuid,
	"title_template" text,
	"description" text,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_estimate_minutes" integer,
	"due_offset_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "task_templates_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "task_templates_category_check" CHECK ("task_templates"."category" in ('gst', 'income_tax', 'tds', 'audit', 'roc', 'accounting', 'payroll', 'advisory', 'notice', 'internal', 'other'))
);
--> statement-breakpoint
ALTER TABLE "task_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"client_id" uuid,
	"filing_id" uuid,
	"notice_id" uuid,
	"engagement_id" uuid,
	"parent_task_id" uuid,
	"template_id" uuid,
	"recurring_task_id" uuid,
	"category" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"assignee_member_id" uuid,
	"reviewer_member_id" uuid,
	"start_date" date,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"estimate_minutes" integer,
	"billable" boolean DEFAULT true NOT NULL,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tasks_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "tasks_number_key" UNIQUE("firm_id","number"),
	CONSTRAINT "tasks_category_check" CHECK ("tasks"."category" in ('gst', 'income_tax', 'tds', 'audit', 'roc', 'accounting', 'payroll', 'advisory', 'notice', 'internal', 'other')),
	CONSTRAINT "tasks_status_check" CHECK ("tasks"."status" in ('todo', 'in_progress', 'waiting_on_client', 'in_review', 'done', 'cancelled')),
	CONSTRAINT "tasks_priority_check" CHECK ("tasks"."priority" in ('low', 'normal', 'high', 'urgent')),
	CONSTRAINT "tasks_number_check" CHECK ("tasks"."number" > 0)
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"client_id" uuid,
	"task_id" uuid,
	"filing_id" uuid,
	"engagement_id" uuid,
	"work_date" date NOT NULL,
	"minutes" integer NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"description" text,
	"billable" boolean DEFAULT true NOT NULL,
	"bill_rate" numeric(15, 2),
	"cost_rate" numeric(15, 2),
	"status" text DEFAULT 'draft' NOT NULL,
	"approved_by_member_id" uuid,
	"approved_at" timestamp with time zone,
	"invoice_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "time_entries_firm_id_id_key" UNIQUE("firm_id","id"),
	CONSTRAINT "time_entries_status_check" CHECK ("time_entries"."status" in ('draft', 'submitted', 'approved', 'rejected')),
	CONSTRAINT "time_entries_minutes_check" CHECK ("time_entries"."minutes" between 1 and 1440),
	CONSTRAINT "time_entries_timer_check" CHECK ("time_entries"."ended_at" is null or "time_entries"."ended_at" >= "time_entries"."started_at")
);
--> statement-breakpoint
ALTER TABLE "time_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_events" ADD CONSTRAINT "auth_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_identity_id_auth_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."auth_identities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_active_firm_id_firms_id_fk" FOREIGN KEY ("active_firm_id") REFERENCES "public"."firms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_factors" ADD CONSTRAINT "mfa_factors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_paid_by_fk" FOREIGN KEY ("firm_id","paid_by_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_receipt_fk" FOREIGN KEY ("firm_id","receipt_document_id") REFERENCES "public"."documents"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_filing_fk" FOREIGN KEY ("firm_id","filing_id") REFERENCES "public"."filings"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_invoice_line_fk" FOREIGN KEY ("firm_id","invoice_line_id") REFERENCES "public"."invoice_lines"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_fk" FOREIGN KEY ("firm_id","invoice_id") REFERENCES "public"."invoices"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_service_fk" FOREIGN KEY ("firm_id","service_id") REFERENCES "public"."services"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_engagement_fk" FOREIGN KEY ("firm_id","engagement_id") REFERENCES "public"."engagements"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_filing_fk" FOREIGN KEY ("firm_id","filing_id") REFERENCES "public"."filings"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_issued_by_user_id_users_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_fk" FOREIGN KEY ("firm_id","branch_id") REFERENCES "public"."firm_branches"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_original_fk" FOREIGN KEY ("firm_id","original_invoice_id") REFERENCES "public"."invoices"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_pdf_fk" FOREIGN KEY ("firm_id","pdf_document_id") REFERENCES "public"."documents"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_fk" FOREIGN KEY ("firm_id","payment_id") REFERENCES "public"."payments"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_fk" FOREIGN KEY ("firm_id","invoice_id") REFERENCES "public"."invoices"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_contact_fk" FOREIGN KEY ("firm_id","contact_id") REFERENCES "public"."contacts"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_credentials" ADD CONSTRAINT "client_credentials_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_credentials" ADD CONSTRAINT "client_credentials_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_credentials" ADD CONSTRAINT "client_credentials_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_credentials" ADD CONSTRAINT "client_credentials_registration_fk" FOREIGN KEY ("firm_id","registration_id") REFERENCES "public"."client_registrations"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_groups" ADD CONSTRAINT "client_groups_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_registrations" ADD CONSTRAINT "client_registrations_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_registrations" ADD CONSTRAINT "client_registrations_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tax_profiles" ADD CONSTRAINT "client_tax_profiles_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tax_profiles" ADD CONSTRAINT "client_tax_profiles_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_contact_fk" FOREIGN KEY ("firm_id","contact_id") REFERENCES "public"."contacts"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_group_fk" FOREIGN KEY ("firm_id","group_id") REFERENCES "public"."client_groups"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_branch_fk" FOREIGN KEY ("firm_id","branch_id") REFERENCES "public"."firm_branches"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_partner_fk" FOREIGN KEY ("firm_id","partner_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_manager_fk" FOREIGN KEY ("firm_id","manager_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_personal_client_fk" FOREIGN KEY ("firm_id","personal_client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dsc_certificates" ADD CONSTRAINT "dsc_certificates_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dsc_certificates" ADD CONSTRAINT "dsc_certificates_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dsc_certificates" ADD CONSTRAINT "dsc_certificates_contact_fk" FOREIGN KEY ("firm_id","contact_id") REFERENCES "public"."contacts"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_contact_fk" FOREIGN KEY ("firm_id","contact_id") REFERENCES "public"."contacts"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_automation_fk" FOREIGN KEY ("firm_id","automation_rule_id") REFERENCES "public"."automation_rules"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_forms" ADD CONSTRAINT "compliance_forms_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_form_id_compliance_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."compliance_forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_registration_fk" FOREIGN KEY ("firm_id","registration_id") REFERENCES "public"."client_registrations"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_engagement_fk" FOREIGN KEY ("firm_id","engagement_id") REFERENCES "public"."engagements"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_assignee_fk" FOREIGN KEY ("firm_id","default_assignee_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_reviewer_fk" FOREIGN KEY ("firm_id","default_reviewer_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_form_id_compliance_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."compliance_forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_statutory_due_date_id_statutory_due_dates_id_fk" FOREIGN KEY ("statutory_due_date_id") REFERENCES "public"."statutory_due_dates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_registration_fk" FOREIGN KEY ("firm_id","registration_id") REFERENCES "public"."client_registrations"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_obligation_fk" FOREIGN KEY ("firm_id","obligation_id") REFERENCES "public"."compliance_obligations"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_engagement_fk" FOREIGN KEY ("firm_id","engagement_id") REFERENCES "public"."engagements"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_revises_fk" FOREIGN KEY ("firm_id","revises_filing_id") REFERENCES "public"."filings"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_assignee_fk" FOREIGN KEY ("firm_id","assignee_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_reviewer_fk" FOREIGN KEY ("firm_id","reviewer_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_reviewed_by_fk" FOREIGN KEY ("firm_id","reviewed_by_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_filed_by_fk" FOREIGN KEY ("firm_id","filed_by_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_registration_fk" FOREIGN KEY ("firm_id","registration_id") REFERENCES "public"."client_registrations"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_filing_fk" FOREIGN KEY ("firm_id","filing_id") REFERENCES "public"."filings"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_assignee_fk" FOREIGN KEY ("firm_id","assignee_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_reviewer_fk" FOREIGN KEY ("firm_id","reviewer_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statutory_due_dates" ADD CONSTRAINT "statutory_due_dates_form_id_compliance_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."compliance_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_parent_fk" FOREIGN KEY ("firm_id","parent_id") REFERENCES "public"."document_folders"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_document_fk" FOREIGN KEY ("firm_id","document_id") REFERENCES "public"."documents"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_filing_fk" FOREIGN KEY ("firm_id","filing_id") REFERENCES "public"."filings"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_task_fk" FOREIGN KEY ("firm_id","task_id") REFERENCES "public"."tasks"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_folder_fk" FOREIGN KEY ("firm_id","folder_id") REFERENCES "public"."document_folders"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_supersedes_fk" FOREIGN KEY ("firm_id","supersedes_document_id") REFERENCES "public"."documents"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_message_fk" FOREIGN KEY ("firm_id","message_id") REFERENCES "public"."messages"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_branches" ADD CONSTRAINT "firm_branches_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_members" ADD CONSTRAINT "firm_members_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_members" ADD CONSTRAINT "firm_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_members" ADD CONSTRAINT "firm_members_role_fk" FOREIGN KEY ("firm_id","role_id") REFERENCES "public"."roles"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_members" ADD CONSTRAINT "firm_members_branch_fk" FOREIGN KEY ("firm_id","branch_id") REFERENCES "public"."firm_branches"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_members" ADD CONSTRAINT "firm_members_reports_to_fk" FOREIGN KEY ("firm_id","reports_to_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_fk" FOREIGN KEY ("firm_id","role_id") REFERENCES "public"."roles"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_contact_fk" FOREIGN KEY ("firm_id","contact_id") REFERENCES "public"."contacts"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_fk" FOREIGN KEY ("firm_id","team_id") REFERENCES "public"."teams"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_member_fk" FOREIGN KEY ("firm_id","member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_lead_fk" FOREIGN KEY ("firm_id","lead_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_integrations" ADD CONSTRAINT "firm_integrations_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_integrations" ADD CONSTRAINT "firm_integrations_connected_by_user_id_users_id_fk" FOREIGN KEY ("connected_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_owner_fk" FOREIGN KEY ("firm_id","owner_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_service_fk" FOREIGN KEY ("firm_id","service_id") REFERENCES "public"."services"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_partner_fk" FOREIGN KEY ("firm_id","partner_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_manager_fk" FOREIGN KEY ("firm_id","manager_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_letter_fk" FOREIGN KEY ("firm_id","engagement_letter_document_id") REFERENCES "public"."documents"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_fk" FOREIGN KEY ("firm_id","parent_comment_id") REFERENCES "public"."comments"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_template_fk" FOREIGN KEY ("firm_id","template_id") REFERENCES "public"."task_templates"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_engagement_fk" FOREIGN KEY ("firm_id","engagement_id") REFERENCES "public"."engagements"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_assignee_fk" FOREIGN KEY ("firm_id","assignee_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_reviewer_fk" FOREIGN KEY ("firm_id","reviewer_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_form_id_compliance_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."compliance_forms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_service_fk" FOREIGN KEY ("firm_id","service_id") REFERENCES "public"."services"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_filing_fk" FOREIGN KEY ("firm_id","filing_id") REFERENCES "public"."filings"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_notice_fk" FOREIGN KEY ("firm_id","notice_id") REFERENCES "public"."notices"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_engagement_fk" FOREIGN KEY ("firm_id","engagement_id") REFERENCES "public"."engagements"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_fk" FOREIGN KEY ("firm_id","parent_task_id") REFERENCES "public"."tasks"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_template_fk" FOREIGN KEY ("firm_id","template_id") REFERENCES "public"."task_templates"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurring_fk" FOREIGN KEY ("firm_id","recurring_task_id") REFERENCES "public"."recurring_tasks"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_fk" FOREIGN KEY ("firm_id","assignee_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reviewer_fk" FOREIGN KEY ("firm_id","reviewer_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_member_fk" FOREIGN KEY ("firm_id","member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_client_fk" FOREIGN KEY ("firm_id","client_id") REFERENCES "public"."clients"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_fk" FOREIGN KEY ("firm_id","task_id") REFERENCES "public"."tasks"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_filing_fk" FOREIGN KEY ("firm_id","filing_id") REFERENCES "public"."filings"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_engagement_fk" FOREIGN KEY ("firm_id","engagement_id") REFERENCES "public"."engagements"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_fk" FOREIGN KEY ("firm_id","approved_by_member_id") REFERENCES "public"."firm_members"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_invoice_fk" FOREIGN KEY ("firm_id","invoice_id") REFERENCES "public"."invoices"("firm_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_events_user_idx" ON "auth_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "auth_events_identifier_idx" ON "auth_events" USING btree ("identifier","created_at");--> statement-breakpoint
CREATE INDEX "auth_events_ip_idx" ON "auth_events" USING btree ("ip","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_one_password_per_user" ON "auth_identities" USING btree ("user_id") WHERE "auth_identities"."provider" = 'password';--> statement-breakpoint
CREATE INDEX "auth_identities_user_idx" ON "auth_identities" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "auth_tokens_identifier_idx" ON "auth_tokens" USING btree ("identifier","purpose");--> statement-breakpoint
CREATE INDEX "auth_tokens_token_hash_idx" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "mfa_factors_user_idx" ON "mfa_factors" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_key" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_key" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "disbursements_client_idx" ON "disbursements" USING btree ("firm_id","client_id","spent_on");--> statement-breakpoint
CREATE INDEX "disbursements_unbilled_idx" ON "disbursements" USING btree ("firm_id","client_id") WHERE "disbursements"."billable" and "disbursements"."invoice_line_id" is null and "disbursements"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices" USING btree ("firm_id","number") WHERE "invoices"."number" is not null;--> statement-breakpoint
CREATE INDEX "invoices_client_idx" ON "invoices" USING btree ("firm_id","client_id","issue_date");--> statement-breakpoint
CREATE INDEX "invoices_open_idx" ON "invoices" USING btree ("firm_id","due_date") WHERE "invoices"."status" = 'issued';--> statement-breakpoint
CREATE INDEX "payment_allocations_invoice_idx" ON "payment_allocations" USING btree ("firm_id","invoice_id");--> statement-breakpoint
CREATE INDEX "payments_client_idx" ON "payments" USING btree ("firm_id","client_id","received_on");--> statement-breakpoint
CREATE UNIQUE INDEX "client_contacts_one_primary" ON "client_contacts" USING btree ("client_id") WHERE "client_contacts"."is_primary";--> statement-breakpoint
CREATE INDEX "client_contacts_contact_idx" ON "client_contacts" USING btree ("firm_id","contact_id");--> statement-breakpoint
CREATE INDEX "client_credentials_client_idx" ON "client_credentials" USING btree ("firm_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_groups_name_key" ON "client_groups" USING btree ("firm_id","name") WHERE "client_groups"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "client_registrations_number_key" ON "client_registrations" USING btree ("firm_id","type","number") WHERE "client_registrations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "client_registrations_client_idx" ON "client_registrations" USING btree ("firm_id","client_id");--> statement-breakpoint
CREATE INDEX "client_users_user_idx" ON "client_users" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_code_key" ON "clients" USING btree ("firm_id","code") WHERE "clients"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_pan_key" ON "clients" USING btree ("firm_id","pan") WHERE "clients"."pan" is not null and "clients"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "clients" USING btree ("firm_id","status");--> statement-breakpoint
CREATE INDEX "clients_partner_idx" ON "clients" USING btree ("firm_id","partner_member_id");--> statement-breakpoint
CREATE INDEX "clients_manager_idx" ON "clients" USING btree ("firm_id","manager_member_id");--> statement-breakpoint
CREATE INDEX "clients_group_idx" ON "clients" USING btree ("firm_id","group_id");--> statement-breakpoint
CREATE INDEX "clients_tags_idx" ON "clients" USING gin ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_din_key" ON "contacts" USING btree ("firm_id","din") WHERE "contacts"."din" is not null and "contacts"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "contacts_phone_idx" ON "contacts" USING btree ("firm_id","phone");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("firm_id","email");--> statement-breakpoint
CREATE INDEX "dsc_certificates_valid_to_idx" ON "dsc_certificates" USING btree ("firm_id","valid_to");--> statement-breakpoint
CREATE INDEX "automation_rules_next_run_idx" ON "automation_rules" USING btree ("next_run_at") WHERE "automation_rules"."is_active" and "automation_rules"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "messages_client_idx" ON "messages" USING btree ("firm_id","client_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_entity_idx" ON "messages" USING btree ("firm_id","entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_provider_key" ON "messages" USING btree ("provider","provider_message_id") WHERE "messages"."provider_message_id" is not null;--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("user_id","created_at") WHERE "notifications"."read_at" is null;--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "compliance_forms_builtin_code_key" ON "compliance_forms" USING btree ("code") WHERE "compliance_forms"."firm_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "compliance_forms_firm_code_key" ON "compliance_forms" USING btree ("firm_id","code") WHERE "compliance_forms"."firm_id" is not null;--> statement-breakpoint
CREATE INDEX "compliance_obligations_form_idx" ON "compliance_obligations" USING btree ("firm_id","form_id");--> statement-breakpoint
CREATE INDEX "filings_open_due_idx" ON "filings" USING btree ("firm_id","due_date") WHERE "filings"."status" not in ('filed', 'not_applicable', 'cancelled');--> statement-breakpoint
CREATE INDEX "filings_client_idx" ON "filings" USING btree ("firm_id","client_id","due_date");--> statement-breakpoint
CREATE INDEX "filings_assignee_idx" ON "filings" USING btree ("firm_id","assignee_member_id","status");--> statement-breakpoint
CREATE INDEX "filings_batch_idx" ON "filings" USING btree ("firm_id","form_id","period_key");--> statement-breakpoint
CREATE INDEX "filings_calendar_idx" ON "filings" USING btree ("statutory_due_date_id");--> statement-breakpoint
CREATE INDEX "notices_open_idx" ON "notices" USING btree ("firm_id","response_due_on") WHERE "notices"."status" <> 'closed' and "notices"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "notices_client_idx" ON "notices" USING btree ("firm_id","client_id");--> statement-breakpoint
CREATE INDEX "statutory_due_dates_due_idx" ON "statutory_due_dates" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "document_links_entity_idx" ON "document_links" USING btree ("firm_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "document_requests_client_idx" ON "document_requests" USING btree ("firm_id","client_id","status");--> statement-breakpoint
CREATE INDEX "documents_client_idx" ON "documents" USING btree ("firm_id","client_id","received_at");--> statement-breakpoint
CREATE INDEX "documents_inbox_idx" ON "documents" USING btree ("firm_id","received_at") WHERE "documents"."status" = 'to_classify' and "documents"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "documents_checksum_idx" ON "documents" USING btree ("firm_id","checksum_sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "firm_branches_name_key" ON "firm_branches" USING btree ("firm_id","name") WHERE "firm_branches"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "firm_branches_one_head_office" ON "firm_branches" USING btree ("firm_id") WHERE "firm_branches"."is_head_office" and "firm_branches"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "firm_members_user_idx" ON "firm_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "firms_slug_key" ON "firms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("firm_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "team_members_member_idx" ON "team_members" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "activity_log_entity_idx" ON "activity_log" USING btree ("firm_id","entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_log_firm_idx" ON "activity_log" USING btree ("firm_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_log_actor_idx" ON "activity_log" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "firm_integrations_kind_idx" ON "firm_integrations" USING btree ("firm_id","kind");--> statement-breakpoint
CREATE INDEX "saved_views_screen_idx" ON "saved_views" USING btree ("firm_id","screen");--> statement-breakpoint
CREATE INDEX "engagements_client_idx" ON "engagements" USING btree ("firm_id","client_id");--> statement-breakpoint
CREATE INDEX "engagements_billing_idx" ON "engagements" USING btree ("firm_id","next_billing_on") WHERE "engagements"."status" = 'active' and "engagements"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "comments_entity_idx" ON "comments" USING btree ("firm_id","entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "recurring_tasks_next_run_idx" ON "recurring_tasks" USING btree ("next_run_on") WHERE "recurring_tasks"."is_active" and "recurring_tasks"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "task_templates_form_idx" ON "task_templates" USING btree ("firm_id","form_id");--> statement-breakpoint
CREATE INDEX "tasks_assignee_idx" ON "tasks" USING btree ("firm_id","assignee_member_id","status");--> statement-breakpoint
CREATE INDEX "tasks_open_due_idx" ON "tasks" USING btree ("firm_id","due_date") WHERE "tasks"."status" not in ('done', 'cancelled') and "tasks"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "tasks_client_idx" ON "tasks" USING btree ("firm_id","client_id");--> statement-breakpoint
CREATE INDEX "tasks_filing_idx" ON "tasks" USING btree ("firm_id","filing_id");--> statement-breakpoint
CREATE INDEX "time_entries_member_idx" ON "time_entries" USING btree ("firm_id","member_id","work_date");--> statement-breakpoint
CREATE INDEX "time_entries_client_idx" ON "time_entries" USING btree ("firm_id","client_id","work_date");--> statement-breakpoint
CREATE INDEX "time_entries_task_idx" ON "time_entries" USING btree ("firm_id","task_id");--> statement-breakpoint
CREATE INDEX "time_entries_unbilled_idx" ON "time_entries" USING btree ("firm_id","client_id") WHERE "time_entries"."billable" and "time_entries"."invoice_id" is null and "time_entries"."deleted_at" is null;