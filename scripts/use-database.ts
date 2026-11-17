/**
 * Switches .env.local between the local development database and Supabase.
 *
 *   npm run use-db -- supabase   # uses .env.supabase.local (backs up .env.local first)
 *   npm run use-db -- local      # restores the database lines from .env.localdb.local
 *
 * Only the database lines change; every other setting is kept. Secrets are never printed.
 */
import fs from "node:fs";
import { parse } from "dotenv";

const target = process.argv[2];
const LOCAL_BACKUP = ".env.localdb.local";
const DB_KEYS = ["DATABASE_URL", "DIRECT_URL", "SHADOW_DATABASE_URL", "DATABASE_POOL_MAX"] as const;

function setKeys(text: string, values: Partial<Record<(typeof DB_KEYS)[number], string | null>>) {
  const lines = text.split(/\r?\n/);
  for (const key of DB_KEYS) {
    if (!(key in values)) continue;
    const value = values[key];
    const idx = lines.findIndex((l) => new RegExp(`^#?\s*${key}=`).test(l));
    const line = value === null ? `# ${key}=` : `${key}="${value}"`;
    if (idx >= 0) lines[idx] = value === null ? `# ${lines[idx].replace(/^#\s*/, "")}` : line;
    else if (value !== null) lines.push(line);
  }
  return lines.join("\n");
}

const current = fs.readFileSync(".env.local", "utf8");

if (target === "supabase") {
  const env = parse(fs.readFileSync(".env.supabase.local", "utf8"));
  const pw = encodeURIComponent(env.SUPABASE_DB_PASSWORD ?? "");
  if (!pw || !env.SUPABASE_TRANSACTION_URL || !env.SUPABASE_SESSION_URL) throw new Error(".env.supabase.local is incomplete.");
  if (!parse(current).DATABASE_URL?.includes("supabase")) fs.writeFileSync(LOCAL_BACKUP, current);
  const runtime = new URL(env.SUPABASE_TRANSACTION_URL.replace("[YOUR-PASSWORD]", pw));
  runtime.searchParams.set("pgbouncer", "true");
  const direct = new URL(env.SUPABASE_SESSION_URL.replace("[YOUR-PASSWORD]", pw));
  direct.searchParams.set("sslmode", "require");
  direct.searchParams.set("sslcert", "certs/supabase-ca.crt");
  direct.searchParams.set("sslaccept", "strict");
  fs.writeFileSync(
    ".env.local",
    setKeys(current, { DATABASE_URL: runtime.toString(), DIRECT_URL: direct.toString(), SHADOW_DATABASE_URL: null, DATABASE_POOL_MAX: null }),
  );
  console.log(`.env.local now uses Supabase (${runtime.hostname}). Local settings are saved in ${LOCAL_BACKUP}.`);
} else if (target === "local") {
  if (!fs.existsSync(LOCAL_BACKUP)) throw new Error(`${LOCAL_BACKUP} not found.`);
  const local = parse(fs.readFileSync(LOCAL_BACKUP, "utf8"));
  fs.writeFileSync(
    ".env.local",
    setKeys(current, {
      DATABASE_URL: local.DATABASE_URL,
      DIRECT_URL: local.DIRECT_URL,
      SHADOW_DATABASE_URL: local.SHADOW_DATABASE_URL ?? null,
      DATABASE_POOL_MAX: local.DATABASE_POOL_MAX ?? null,
    }),
  );
  console.log(".env.local now uses the local development database. Start it with: npm run db:dev");
} else {
  console.error("Usage: npm run use-db -- supabase | local");
  process.exit(1);
}
