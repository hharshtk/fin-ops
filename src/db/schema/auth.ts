/**
 * Identity and authentication. Provider-neutral: one `users` row per person, any number of
 * `auth_identities` (email + password today; Google, Microsoft, any OIDC or SAML provider later),
 * and server-side sessions we own. Staff and client portal users share these tables; what a user
 * can see is decided by `firm_members` and `client_users`, not here.
 *
 * Secrets are never stored in the clear: passwords as PHC-format hashes (argon2id), session and
 * one-time tokens as SHA-256 hashes, OAuth tokens and TOTP secrets encrypted by the app with a key
 * kept outside the database.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  inet,
  integer,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  createdAt,
  id,
  jsonObject,
  matches,
  metadata,
  oneOf,
  PATTERN,
  softDelete,
  timestamps,
  ts,
} from "./columns";
import {
  AUTH_TOKEN_PURPOSES,
  MFA_TYPES,
  PLATFORM_ROLES,
  USER_STATUSES,
  type AuthTokenPurpose,
  type MfaType,
  type PlatformRole,
  type UserStatus,
} from "./enums";
import { firms } from "./firms";

export const users = pgTable(
  "users",
  {
    id: id(),
    /** Lowercased by the app before writing. */
    email: text(),
    emailVerifiedAt: ts(),
    /** E.164, e.g. +919876543210. Lets client portal users sign in with a phone OTP later. */
    phone: text(),
    phoneVerifiedAt: ts(),
    /** Optional login handle, lowercased. */
    username: text(),
    name: text().notNull(),
    avatarUrl: text(),
    locale: text().notNull().default("en-IN"),
    timeZone: text().notNull().default("Asia/Kolkata"),
    status: text().$type<UserStatus>().notNull().default("active"),
    platformRole: text().$type<PlatformRole>(),
    lastLoginAt: ts(),
    /** UI preferences that follow the person across firms (theme, density, shortcuts). */
    preferences: jsonObject(),
    metadata: metadata(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    uniqueIndex("users_phone_key").on(t.phone),
    uniqueIndex("users_username_key").on(t.username),
    check("users_email_lowercase_check", sql`${t.email} = lower(${t.email})`),
    check(
      "users_username_lowercase_check",
      sql`${t.username} = lower(${t.username})`,
    ),
    check(
      "users_login_handle_check",
      sql`coalesce(${t.email}, ${t.phone}, ${t.username}) is not null`,
    ),
    matches("users_phone_check", t.phone, PATTERN.phone),
    oneOf("users_status_check", t.status, USER_STATUSES),
    oneOf("users_platform_role_check", t.platformRole, PLATFORM_ROLES),
  ],
).enableRLS();

/**
 * One row per way a user can sign in. `provider` is an open string so adding a provider needs no
 * migration: "password", "google", "microsoft", "apple", "oidc:<slug>", "saml:<slug>".
 */
export const authIdentities = pgTable(
  "auth_identities",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text().notNull(),
    /** The provider's stable subject ID (OIDC `sub`). For "password", the user's ID. */
    providerAccountId: text().notNull(),
    /** Email as asserted by the provider; used to offer account linking, never trusted alone. */
    email: text(),
    emailVerified: boolean().notNull().default(false),
    /** PHC string (algorithm, parameters, salt, hash). Only for provider "password". */
    passwordHash: text(),
    passwordChangedAt: ts(),
    /** Encrypted by the app. Kept only when we call the provider's API on the user's behalf. */
    accessTokenEnc: text(),
    refreshTokenEnc: text(),
    tokenExpiresAt: ts(),
    scope: text(),
    /** Raw profile or ID-token claims from the provider. */
    profile: jsonObject(),
    lastUsedAt: ts(),
    metadata: metadata(),
    ...timestamps(),
  },
  (t) => [
    unique("auth_identities_provider_account_key").on(
      t.provider,
      t.providerAccountId,
    ),
    uniqueIndex("auth_identities_one_password_per_user")
      .on(t.userId)
      .where(sql`${t.provider} = 'password'`),
    index("auth_identities_user_idx").on(t.userId),
    check(
      "auth_identities_password_hash_check",
      sql`(${t.provider} = 'password') = (${t.passwordHash} is not null)`,
    ),
  ],
).enableRLS();

/**
 * Server-side sessions. The cookie holds a random token; only its SHA-256 hash is stored, so a
 * database leak does not leak live sessions. Revoking is a single UPDATE.
 */
export const authSessions = pgTable(
  "auth_sessions",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text().notNull(),
    /** How this session was created. */
    identityId: uuid().references(() => authIdentities.id, {
      onDelete: "set null",
    }),
    /** Firm the user is working in, for people who belong to more than one. */
    activeFirmId: uuid().references(() => firms.id, { onDelete: "set null" }),
    /** Extra context such as the client a portal user is viewing. */
    context: jsonObject(),
    ip: inet(),
    userAgent: text(),
    createdAt: createdAt(),
    lastSeenAt: ts().notNull().defaultNow(),
    expiresAt: ts().notNull(),
    mfaVerifiedAt: ts(),
    revokedAt: ts(),
    revokedReason: text(),
  },
  (t) => [
    uniqueIndex("auth_sessions_token_hash_key").on(t.tokenHash),
    index("auth_sessions_user_idx").on(t.userId),
    index("auth_sessions_expires_idx").on(t.expiresAt),
  ],
).enableRLS();

/**
 * Single-use tokens: email verification, password reset, magic links and OTPs. Short OTP codes can
 * collide between users, so `token_hash` is not unique; look up by identifier and purpose.
 */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: id(),
    userId: uuid().references(() => users.id, { onDelete: "cascade" }),
    purpose: text().$type<AuthTokenPurpose>().notNull(),
    /** Where the token was sent: an email address or phone number. */
    identifier: text().notNull(),
    tokenHash: text().notNull(),
    expiresAt: ts().notNull(),
    consumedAt: ts(),
    attempts: integer().notNull().default(0),
    metadata: metadata(),
    createdAt: createdAt(),
  },
  (t) => [
    index("auth_tokens_identifier_idx").on(t.identifier, t.purpose),
    index("auth_tokens_token_hash_idx").on(t.tokenHash),
    oneOf("auth_tokens_purpose_check", t.purpose, AUTH_TOKEN_PURPOSES),
  ],
).enableRLS();

/** Second factors. WebAuthn credential data and hashed recovery codes go in `data`. */
export const mfaFactors = pgTable(
  "mfa_factors",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text().$type<MfaType>().notNull(),
    label: text(),
    /** TOTP secret, encrypted by the app. */
    secretEnc: text(),
    data: jsonObject(),
    verifiedAt: ts(),
    lastUsedAt: ts(),
    ...timestamps(),
  },
  (t) => [
    index("mfa_factors_user_idx").on(t.userId),
    oneOf("mfa_factors_type_check", t.type, MFA_TYPES),
  ],
).enableRLS();

/**
 * Security log: sign-ins, failures, resets, MFA changes. Also the source for rate limiting and
 * lockout (failed attempts per identifier or IP in a window).
 */
export const authEvents = pgTable(
  "auth_events",
  {
    id: id(),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    /** What was typed at sign-in, kept even when it matches no user. */
    identifier: text(),
    /** e.g. login_succeeded, login_failed, logout, password_changed, identity_linked. */
    event: text().notNull(),
    provider: text(),
    ip: inet(),
    userAgent: text(),
    data: jsonObject(),
    createdAt: createdAt(),
  },
  (t) => [
    index("auth_events_user_idx").on(t.userId, t.createdAt),
    index("auth_events_identifier_idx").on(t.identifier, t.createdAt),
    index("auth_events_ip_idx").on(t.ip, t.createdAt),
  ],
).enableRLS();
