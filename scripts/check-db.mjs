import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
const { Client } = pg;

const hints = {
  MISSING_DATABASE_URL:
    "Set DATABASE_URL in .env.local with your database password.",
  ERR_INVALID_URL:
    "DATABASE_URL must be a valid postgres:// or postgresql:// URL.",
  "28P01":
    "Password authentication failed. Check the database password in DATABASE_URL.",
  28000: "Authentication failed. Check the database username and password.",
  ENETUNREACH:
    "The database network is unreachable. For IPv4, use the Supabase Session pooler URL.",
  ENOTFOUND: "The database hostname could not be resolved. Check DATABASE_URL.",
  ECONNREFUSED:
    "The database refused the connection. Check the host, port, and network restrictions.",
  SELF_SIGNED_CERT_IN_CHAIN:
    "The server certificate is not trusted by the bundled Supabase CA.",
  ERR_TLS_CERT_ALTNAME_INVALID:
    "The database hostname does not match its TLS certificate.",
};

let client;

try {
  loadEnvConfig(fileURLToPath(new URL("../", import.meta.url)), true);

  const connectionString = process.env.DATABASE_URL;
  if (
    !connectionString ||
    connectionString.includes("[YOUR-DATABASE-PASSWORD]")
  ) {
    throw Object.assign(new Error(), { code: "MISSING_DATABASE_URL" });
  }

  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw Object.assign(new Error(), { code: "ERR_INVALID_URL" });
  }

  // Set TLS explicitly so URL options cannot disable certificate verification.
  for (const key of [
    "ssl",
    "sslmode",
    "sslrootcert",
    "sslcert",
    "sslkey",
    "sslnegotiation",
    "uselibpqcompat",
  ]) {
    url.searchParams.delete(key);
  }

  client = new Client({
    connectionString: url.toString(),
    ssl: {
      ca: readFileSync(
        new URL("./certs/supabase-ca.crt", import.meta.url),
        "utf8",
      ),
      rejectUnauthorized: true,
    },
    connectionTimeoutMillis: 15000,
    query_timeout: 10000,
    application_name: "fin-ops-db-check",
  });

  console.log("Connecting to the database...");
  await client.connect();
  await client.query("BEGIN READ ONLY");
  const { rows } = await client.query(
    "SELECT 1 AS ok, current_database() AS database",
  );
  await client.query("ROLLBACK");

  console.log("Database connection successful.");
  console.log(
    `Database: ${rows[0].database}; SELECT 1: ${rows[0].ok}; TLS certificate verified.`,
  );
} catch (error) {
  // Print only a safe error code and static guidance, never credentials or raw errors.
  const code =
    typeof error?.code === "string" && /^[A-Z0-9_]{1,64}$/.test(error.code)
      ? error.code
      : "UNKNOWN";
  console.error(
    `Database check failed (${code}). ${hints[code] ?? "Connection or query failed."}`,
  );
  process.exitCode = 1;
} finally {
  await client?.end().catch(() => {});
}
