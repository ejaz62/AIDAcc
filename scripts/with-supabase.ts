/**
 * Runs a command against the Supabase database configured in .env.supabase.local,
 * without changing .env.local (which keeps pointing at the local database).
 *
 *   npm run supabase -- prisma migrate deploy
 *   npm run supabase -- vitest run
 *
 * The password is inserted into the connection strings in memory only and is
 * passed to the child process as environment variables; it is never printed.
 * Migrations (DIRECT_URL) use TLS with full verification against certs/supabase-ca.crt;
 * the app's runtime connection (DATABASE_URL) is verified in src/lib/db-ssl.ts.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { parse } from "dotenv";

const file = ".env.supabase.local";
if (!fs.existsSync(file)) {
  console.error(`${file} not found.`);
  process.exit(1);
}
const env = parse(fs.readFileSync(file, "utf8"));
const password = env.SUPABASE_DB_PASSWORD ?? "";
if (!password || !env.SUPABASE_TRANSACTION_URL || !env.SUPABASE_SESSION_URL) {
  console.error(`${file} is incomplete (needs SUPABASE_TRANSACTION_URL, SUPABASE_SESSION_URL and SUPABASE_DB_PASSWORD).`);
  process.exit(1);
}

const withPassword = (s: string) => s.replace("[YOUR-PASSWORD]", encodeURIComponent(password));

const runtime = new URL(withPassword(env.SUPABASE_TRANSACTION_URL));
runtime.searchParams.set("pgbouncer", "true");

const direct = new URL(withPassword(env.SUPABASE_SESSION_URL));
// Prisma's migration engine uses its own TLS parameters: `sslcert` is the trusted root
// certificate (path relative to the project folder) and `sslaccept=strict` enforces
// verification (tested: a wrong CA is rejected).
direct.searchParams.set("sslmode", "require");
direct.searchParams.set("sslcert", process.env.SUPABASE_SSLCERT || "certs/supabase-ca.crt");
direct.searchParams.set("sslaccept", "strict");

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: npm run supabase -- <command> [args]");
  process.exit(1);
}

const childEnv: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: runtime.toString(),
  DIRECT_URL: direct.toString(),
  // Supabase handles many connections; the local single-connection limit does not apply.
  DATABASE_POOL_MAX: "",
  // Never used against Supabase.
  SHADOW_DATABASE_URL: "",
};

console.log(`[supabase] running "${[command, ...args].join(" ")}" against ${direct.hostname}`);
const result = spawnSync(command, args, { env: childEnv, stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
