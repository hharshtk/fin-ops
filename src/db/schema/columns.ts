/**
 * Column and constraint helpers shared by every table. Plain Postgres only: nothing here depends
 * on a hosting provider, extension or auth service.
 *
 * Every helper is a function declaration, not an arrow const. Table files import each other
 * (inside lazy `references(() => …)` callbacks), and hoisted functions keep those import cycles
 * safe under both ESM (Next.js) and CJS (drizzle-kit).
 */
import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  jsonb,
  numeric,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "../ids";

export type Json = Record<string, unknown>;

/** Time-ordered UUID primary key. */
export function id() {
  return uuid().primaryKey().defaultRandom().$defaultFn(uuidv7);
}

/** An instant. Always stored with time zone; the UI renders it in IST. */
export function ts() {
  return timestamp({ withTimezone: true });
}

/** A calendar date (due dates, filing dates). Read and written as 'YYYY-MM-DD'. */
export function day() {
  return date({ mode: "string" });
}

/** INR amount. Exact decimal, read as a string so no value ever passes through a float. */
export function money() {
  return numeric({ precision: 15, scale: 2 });
}

/** Percentage such as a GST rate (18.00). */
export function rate() {
  return numeric({ precision: 5, scale: 2 });
}

export function createdAt() {
  return ts().notNull().defaultNow();
}

export function timestamps() {
  return {
    createdAt: createdAt(),
    updatedAt: ts()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  };
}

/** Soft delete for records people may want back. Statutory records use a status instead. */
export function softDelete() {
  return { deletedAt: ts() };
}

/** JSONB object, default `{}`. Typed in TypeScript, unconstrained in the database. */
export function jsonObject<T = Json>() {
  return jsonb()
    .$type<T>()
    .notNull()
    .default(sql`'{}'::jsonb`);
}

/** JSONB array, default `[]`. */
export function jsonArray<T>() {
  return jsonb()
    .$type<T[]>()
    .notNull()
    .default(sql`'[]'::jsonb`);
}

/** Free-form extension point on every main table, for data we have not modelled yet. */
export function metadata() {
  return jsonObject();
}

/** Values for firm-defined fields; definitions live in `custom_field_definitions`. */
export function customFields() {
  return jsonObject();
}

export function tags() {
  return text()
    .array()
    .notNull()
    .default(sql`'{}'::text[]`);
}

/** CHECK that a text column holds one of a fixed set of values (NULL passes). */
export function oneOf(
  name: string,
  column: AnyPgColumn,
  values: readonly string[],
) {
  const list = values.map((v) => `'${v.replaceAll("'", "''")}'`).join(", ");
  return check(name, sql`${column} in (${sql.raw(list)})`);
}

/** CHECK that a text column matches a POSIX regular expression (NULL passes). */
export function matches(name: string, column: AnyPgColumn, pattern: string) {
  return check(
    name,
    sql`${column} ~ ${sql.raw(`'${pattern.replaceAll("'", "''")}'`)}`,
  );
}

/**
 * `UNIQUE (firm_id, id)` on a firm-owned table, so child tables can point at it with a composite
 * foreign key that includes `firm_id`.
 */
export function tenantKey(
  name: string,
  t: { firmId: AnyPgColumn; id: AnyPgColumn },
) {
  return unique(name).on(t.firmId, t.id);
}

/**
 * Foreign key on `(firm_id, <column>)` → `(firm_id, id)`. The database then rejects any row
 * that points at another firm's record, even if application code has a bug. A NULL column
 * skips the check (MATCH SIMPLE), so optional references work.
 */
export function tenantFk(
  name: string,
  firmId: AnyPgColumn,
  column: AnyPgColumn,
  parent: { firmId: AnyPgColumn; id: AnyPgColumn },
) {
  return foreignKey({
    name,
    columns: [firmId, column],
    foreignColumns: [parent.firmId, parent.id],
  });
}

/** Shared identifier formats (Income Tax, GST and MCA). */
export const PATTERN = {
  pan: "^[A-Z]{5}[0-9]{4}[A-Z]$",
  /**
   * 2-digit state code, 10-char PAN (or TAN for TDS registrations), entity number, a type
   * letter ('Z' for regular taxpayers), check character. Kept loose on purpose: TDS, TCS, NRTP
   * and OIDAR registrations all vary the middle part.
   */
  gstin: "^[0-9]{2}[A-Z0-9]{10}[0-9A-Z][A-Z][0-9A-Z]$",
  tan: "^[A-Z]{4}[0-9]{5}[A-Z]$",
  cin: "^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$",
  llpin: "^[A-Z]{3}-[0-9]{4}$",
  din: "^[0-9]{8}$",
  stateCode: "^[0-9]{2}$",
  fy: "^[0-9]{4}-[0-9]{2}$",
  phone: "^\\+[1-9][0-9]{6,14}$",
  icaiMembership: "^[0-9]{6}$",
  sac: "^99[0-9]{4}$",
  fieldKey: "^[a-z][a-z0-9_]{0,62}$",
} as const;
