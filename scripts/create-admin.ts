/**
 * Creates an AIDA staff (admin) account, or resets an existing account's password.
 *
 *   npm run admin:create
 *   npm run admin:create -- --reset-password
 *
 * The password is typed at a hidden prompt. For automation it can be piped on
 * stdin instead (first line), with --email and --name flags. Passwords are
 * never accepted as command-line arguments (they would end up in shell history).
 */
import { config } from "dotenv";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sslFor } from "../src/lib/db-ssl";
import { createAuth } from "../src/lib/auth-config";
import { createAdminUser, newAdminSchema, resetAdminPassword } from "../src/features/admin/users";

config({ path: [".env.local", ".env"], quiet: true });

/**
 * Value of a --flag. Joins the following words until the next flag, because some
 * shells (e.g. PowerShell → npm.cmd) drop quotes, splitting "Ada Lovelace" in two.
 */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const words: string[] = [];
  for (const w of process.argv.slice(i + 1)) {
    if (w.startsWith("--")) break;
    words.push(w);
  }
  return words.length ? words.join(" ") : undefined;
}

async function ask(question: string, hidden = false): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });
}

async function readStdinLine(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8").split(/\r?\n/)[0] ?? "";
}

async function main() {
  const reset = process.argv.includes("--reset-password");
  const { DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL } = process.env;
  if (!DATABASE_URL || !BETTER_AUTH_SECRET || !BETTER_AUTH_URL) {
    throw new Error("DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL must be set (see .env.example).");
  }

  const interactive = process.stdin.isTTY;
  const email = arg("email") ?? (interactive ? await ask("Staff email address: ") : "");
  const name = reset ? "" : (arg("name") ?? (interactive ? await ask("Full name: ") : ""));

  let password: string;
  if (interactive) {
    password = await ask(`${reset ? "New password" : "Password"} (min 12 characters, hidden): `, true);
    const confirm = await ask("Confirm password: ", true);
    if (password !== confirm) throw new Error("Passwords do not match.");
  } else {
    password = await readStdinLine();
  }

  const check = reset
    ? newAdminSchema.pick({ email: true, password: true }).safeParse({ email, password })
    : newAdminSchema.safeParse({ email, name, password });
  if (!check.success) throw new Error(check.error.issues.map((i) => i.message).join("\n"));

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL, ssl: sslFor(DATABASE_URL) }), transactionOptions: { maxWait: 10_000, timeout: 20_000 } });
  try {
    const auth = createAuth(db, { secret: BETTER_AUTH_SECRET, baseURL: BETTER_AUTH_URL, nextCookies: false });
    if (reset) {
      const user = await resetAdminPassword(auth, db, email, password);
      console.log(`Password updated for ${user.email}. All of their sessions were signed out.`);
    } else {
      const user = await createAdminUser(auth, db, { email, name, password });
      console.log(`Staff account created for ${user.email}. Sign in at ${BETTER_AUTH_URL}/admin/sign-in`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
