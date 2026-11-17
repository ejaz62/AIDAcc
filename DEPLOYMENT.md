# Deploying AIDA

This guide takes the application from your computer to a live website using
**Supabase** (PostgreSQL database) and **Vercel** (hosting). Steps marked
**You** need your own accounts or secrets. Secrets are only ever typed into
`.env.local` (never committed) or the Vercel dashboard. Never paste them into
code, chat or documents.

---

## 1. Supabase database

1. **You:** create a project at <https://supabase.com/dashboard>.
   - Choose the region closest to most of your users (and to your Vercel region).
   - Save the database password in your password manager.
2. **You:** open **Project → Connect** (or *Project Settings → Database*) and copy two connection strings:
   - **Transaction pooler** (port **6543**). This becomes `DATABASE_URL`. Add `?pgbouncer=true` to the end.
   - **Session pooler** or **Direct connection** (port **5432**). This becomes `DIRECT_URL` (used for migrations).
3. **You:** put them in `.env.local` on your computer, replacing the local values:
   ```
   DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   ```
   Remove (or comment out) `SHADOW_DATABASE_URL`. It is only for the local development database.
4. **Developer:** apply the schema and verify everything against Supabase:
   ```bash
   npm run db:deploy      # creates the tables
   npm test               # unit + integration tests against Supabase
   ```
5. **You:** create your own staff account (you type the password; it is never shown or stored in plain text):
   ```bash
   npm run admin:create
   ```

## 2. Code on GitHub

1. **You:** create an empty **private** repository on GitHub (no README or licence).
2. Push this project to it:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

## 3. Vercel hosting

1. **You:** sign in at <https://vercel.com> with GitHub, choose **Add New → Project** and import the repository.
   The framework is detected as Next.js automatically. Leave the build settings as they are: Vercel runs
   `npm run vercel-build`, which applies any new database migrations and then builds.
2. **You:** before the first deploy, add these **Environment Variables** (Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Supabase transaction pooler URL (port 6543, `?pgbouncer=true`) |
   | `DIRECT_URL` | Supabase session/direct URL (port 5432) |
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
