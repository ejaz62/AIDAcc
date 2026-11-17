# Deploying AIDA

This guide takes the application from your computer to a live website using
**Supabase** (PostgreSQL database) and **Vercel** (hosting). Steps marked
**You** need your own accounts or secrets. Secrets are only ever typed into
`.env.local` (never committed) or the Vercel dashboard. Never paste them into
code, chat or documents.

---

## 1. Supabase database

> **Status (17 Nov 2026):** done. The project is in region ap-southeast-2 (Sydney), its tables are
> created, all tests pass against it, and `.env.local` points at it. Remaining for you: step 6.

1. **You:** create a project at <https://supabase.com/dashboard> (generated database password; save it).
2. **You:** in **Connect → Connection String**, copy the **Transaction pooler** string (port 6543) into
   `.env.supabase.local` as `SUPABASE_TRANSACTION_URL`, and the password as `SUPABASE_DB_PASSWORD`.
   The Session pooler string (port 5432) is the same with the port changed (`SUPABASE_SESSION_URL`).
   This file is git-ignored; strings may keep their `[YOUR-PASSWORD]` placeholder.
3. **You:** *Project Settings → Database → SSL Configuration → Download certificate*. It is stored in the
   repository as `certs/supabase-ca.crt` (a public certificate, not a secret). All connections to Supabase
   are encrypted **and verified** against it (`src/lib/db-ssl.ts`; migrations via `sslcert`/`sslaccept=strict`).
4. **Developer:** check, migrate and test without touching `.env.local`:
   ```bash
   npm run db:check -- --supabase-file          # read-only connection check
   npm run supabase -- npx prisma migrate deploy  # create/update tables
   npm run supabase -- npx vitest run             # full test suite against Supabase
   ```
5. **Developer:** point the local site at Supabase (the local settings are saved in `.env.localdb.local`):
   ```bash
   npm run use-db -- supabase    # switch back any time with: npm run use-db -- local
   ```
6. **You:** create your own staff account (you type the password; it is never shown or stored in plain text):
   ```bash
   npm run admin:create
   ```
7. **Developer:** after a release that adds knowledge-base sections, load them (adds missing sections and FAQ
   questions only; never overwrites staff edits):
   ```bash
   npm run supabase -- npm run kb:seed
   ```

## 2. Code on GitHub

> **Status (17 Nov 2026):** done — private repository `ejaz62/AIDAcc`, branch `main`.

1. **You:** create an empty **private** repository on GitHub (no README or licence).
2. Push this project to it:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

## 3. Vercel hosting

> **Status (17 Nov 2026):** project `aid-acc` (https://aid-acc.vercel.app) created and its environment
> variables added (generated into the git-ignored `.env.vercel.local`, with production-only secrets).

1. **You:** sign in at <https://vercel.com> with GitHub, choose **Add New → Project** and import the repository.
   The framework is detected as Next.js automatically. Leave the build settings as they are: Vercel runs
   `npm run vercel-build`, which applies any new database migrations and then builds.
2. **You:** before the first deploy, add these **Environment Variables** (Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Copy from your `.env.local` (Supabase transaction pooler, port 6543, `?pgbouncer=true`) |
   | `DIRECT_URL` | Copy from your `.env.local` (session pooler, port 5432, with `sslmode=require&sslcert=certs/supabase-ca.crt&sslaccept=strict`) |
   | `IP_HASH_SALT` | New random value: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `BETTER_AUTH_SECRET` | New random value: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
   | `BETTER_AUTH_URL` | The site's public address, e.g. `https://aida-xyz.vercel.app` (later your own domain) |
   | `SITE_URL` | Same as `BETTER_AUTH_URL` |
   | `CRON_SECRET` | New random value (as above). Vercel sends it to the daily job |
   | `ALLOW_SEARCH_INDEXING` | Leave **empty** until launch day |
   | `EMAIL_PROVIDER` etc. | Optional, see section 5 (Email) |

   Use **new** random values for production. Do not reuse the ones from your local `.env.local`.
3. **You:** click **Deploy**. When it finishes, open the site.
4. **Developer:** run the post-deploy checks (section 4).
5. **Later, you:** add your own domain under **Project → Settings → Domains**, then update
   `BETTER_AUTH_URL` and `SITE_URL` to it and redeploy.

## 4. Post-deploy checks

- `https://<site>/api/health` returns `{"status":"ok","database":"ok"}`
- Home, About, Programmes, Register Interest, Contact and Privacy load on desktop and mobile
- A test Register Interest submission appears in **Admin → Registrations** (then delete it)
- Staff sign-in, sign-out and **My account → Change password** work
- `https://<site>/robots.txt` shows `Disallow: /` (indexing is still blocked)
- Security headers are present (e.g. check with <https://securityheaders.com>)
- Vercel → **Settings → Cron Jobs** lists `/api/cron/daily` (runs daily at 03:17 UTC)

## 5. Email (optional until you want real emails)

Without these settings the site runs in **preview mode**: confirmation emails and staff
notifications are recorded in **Admin → Emails** (so you can check them) but not sent.

1. **You:** create an account at <https://resend.com>, add the domain AIDA will send from under
   **Domains**, and add the DNS records it shows at your domain provider. Wait until it shows *Verified*.
2. **You:** create an API key (*Sending access* is enough).
3. **You:** add these to Vercel (and to `.env.local` if you want real emails locally):

   | Variable | Value |
   | --- | --- |
   | `EMAIL_PROVIDER` | `resend` |
   | `RESEND_API_KEY` | the API key |
   | `EMAIL_FROM` | e.g. `AIDA <noreply@your-verified-domain>` |
   | `EMAIL_REPLY_TO` | optional, e.g. the official enquiries address |

4. Redeploy, then use **Admin → Emails → Send me a test email**.
5. Each staff member chooses *instant alerts*, *daily summary* or *no emails* under **My account**.

## 6. Launch-day checklist

1. Privacy notice reviewed by someone qualified, and the data controller details completed.
2. **Admin → Site details**: official contact details and About content entered, **Save and publish**.
3. **Admin → Site details**: untick the *development preview* notice and publish.
4. **Admin → Programmes**: verified programmes published.
5. Vercel: set `ALLOW_SEARCH_INDEXING` to `true` (Production only) and **redeploy**.
6. Check `robots.txt` now allows indexing and lists the sitemap; submit `https://<site>/sitemap.xml` in Google Search Console.

## Operations

- **Backups:** Supabase takes daily backups on paid plans; on the free plan, export regularly
  (*Database → Backups*) or upgrade before launch.
- **Daily job:** queues the staff daily summary, delivers queued emails and retries failed ones, then
  removes rate-limit records older than 30 days, sign-in attempt records older than 90 days, email
  records older than 30 days, and expired sessions. Run it manually with `npm run db:cleanup`.
- **New staff:** **Admin → Staff → Add staff member**. Share the temporary password securely.
- **Schema changes:** create migrations locally with `npm run db:migrate`, commit them, and deploy;
  Vercel applies them automatically.
