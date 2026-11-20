/**
 * Database schema. Postgres 15 or newer (for UNIQUE … NULLS NOT DISTINCT); no extensions and no
 * provider-specific features, so it runs on any managed or self-hosted Postgres.
 * Design notes and the table map: docs/DATA-MODEL.md.
 *
 * Every table has row-level security enabled and, for now, no policies. That denies all access to
 * any role that is neither the table owner nor BYPASSRLS. The app's connection role is the owner,
 * so it is unaffected; roles a host exposes through an auto-generated API (Supabase's `anon` and
 * `authenticated` via PostgREST, for example) get nothing. Firm-scoped policies come later.
 */
export * from "./auth";
export * from "./billing";
export * from "./clients";
export * from "./comms";
export * from "./compliance";
export * from "./documents";
export * from "./firms";
export * from "./platform";
export * from "./relations";
export * from "./services";
export * from "./work";
