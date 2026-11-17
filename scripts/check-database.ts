/**
 * Checks that a database is reachable, without changing anything.
 *
 *   npm run db:check                         # uses .env.local (DATABASE_URL / DIRECT_URL)
 *   npm run db:check -- --supabase-file      # uses .env.supabase.local (see below)
 *
 * .env.supabase.local holds SUPABASE_TRANSACTION_URL and SUPABASE_SESSION_URL exactly as
 * copied from Supabase (they may contain "[YOUR-PASSWORD]") plus SUPABASE_DB_PASSWORD.
 * The password is inserted here and is never printed.
 */
import fs from "node:fs";
import { parse } from "dotenv";
import pg from "pg";
import { sslFor } from "../src/lib/db-ssl";

interface Target {
  label: string;
  url: string;
}

function targetsFromSupabaseFile(): { targets: Target[]; secret: string } {
  const env = parse(fs.readFileSync(".env.supabase.local", "utf8"));
  const password = env.SUPABASE_DB_PASSWORD ?? "";
  if (!password) throw new Error("SUPABASE_DB_PASSWORD is empty in .env.supabase.local");
  const withPassword = (s = "") => s.replace("[YOUR-PASSWORD]", encodeURIComponent(password));
  return {
    secret: password,
    targets: [
      { label: "Session pooler (5432)", url: withPassword(env.SUPABASE_SESSION_URL) },
      { label: "Transaction pooler (6543)", url: withPassword(env.SUPABASE_TRANSACTION_URL) },
    ],
  };
}

function targetsFromEnvLocal(): { targets: Target[]; secret: string } {
  const env = parse(fs.readFileSync(".env.local", "utf8"));
  return {
    secret: "",
    targets: [
      { label: "DATABASE_URL", url: env.DATABASE_URL ?? "" },
      { label: "DIRECT_URL", url: env.DIRECT_URL ?? "" },
    ],
  };
}

function redact(text: string, secret: string) {
  let out = text.replace(/\/\/([^:@/]+):[^@]*@/g, "//$1:***@");
  if (secret) out = out.split(secret).join("***").split(encodeURIComponent(secret)).join("***");
  return out;
}

async function check(t: Target, secret: string) {
  const host = (() => {
    try {
      const u = new URL(t.url);
      return `${u.hostname}:${u.port}`;
    } catch {
      return "(invalid URL)";
    }
  })();
  // Drop parameters meant for Prisma's migration engine; TLS is configured by sslFor().
  const url = (() => {
    try {
      const u = new URL(t.url);
      for (const p of ["sslmode", "sslcert", "sslaccept", "sslrootcert", "pgbouncer"]) u.searchParams.delete(p);
      return u.toString();
    } catch {
      return t.url;
    }
  })();
  const ssl = sslFor(url);
  const client = new pg.Client({ connectionString: url, ssl, connectionTimeoutMillis: 10_000 });
  try {
    await client.connect();
    const { rows } = await client.query(
      "select current_database() as db, split_part(version(), ' ', 2) as postgres, " +
        "(select count(*)::int from information_schema.tables where table_schema = 'public') as public_tables",
    );
    // The link from this machine: a TLS socket whose certificate was verified against the CA.
    const socket = (client as unknown as { connection?: { stream?: { encrypted?: boolean; authorized?: boolean } } })
      .connection?.stream;
    const tls = socket?.encrypted ? (socket.authorized ? "encrypted+verified" : "encrypted (NOT verified)") : "not encrypted";
    console.log(`OK      ${t.label}  ${host}  tls=${tls}  ${JSON.stringify(rows[0])}`);
    if (process.argv.includes("--counts")) {
      const tables = await client.query(
        "select table_name from information_schema.tables where table_schema = 'public' and table_name <> '_prisma_migrations' order by 1",
      );
      const counts: Record<string, number> = {};
      for (const { table_name } of tables.rows) {
        const r = await client.query(`select count(*)::int as n from "${String(table_name).replace(/"/g, "")}"`);
        counts[table_name] = r.rows[0].n;
      }
      console.log("        row counts:", JSON.stringify(counts));
    }
    return true;
  } catch (err) {
    console.log(`FAILED  ${t.label}  ${host}  ${redact(err instanceof Error ? err.message : String(err), secret)}`);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  const { targets, secret } = process.argv.includes("--supabase-file") ? targetsFromSupabaseFile() : targetsFromEnvLocal();
  let allOk = true;
  const list = process.argv.includes("--counts") ? targets.slice(0, 1) : targets;
  for (const t of list) allOk = (await check(t, secret)) && allOk;
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
