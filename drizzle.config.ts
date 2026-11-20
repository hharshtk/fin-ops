import { readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

/**
 * Connection for drizzle-kit (generate, migrate, studio). Any Postgres URL works. TLS is verified
 * against the CA certificate at DATABASE_CA_CERT; it defaults to the bundled certificate for the
 * current host, so changing provider means changing two environment variables.
 */
function credentials() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { url: "" };
  const url = new URL(raw);
  const caPath =
    process.env.DATABASE_CA_CERT ?? "scripts/certs/supabase-ca.crt";
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) || "postgres",
    ssl:
      process.env.DATABASE_SSL === "disable"
        ? false
        : { ca: readFileSync(caPath, "utf8"), rejectUnauthorized: true },
  };
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  strict: true,
  verbose: true,
  dbCredentials: credentials(),
});
