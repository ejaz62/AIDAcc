# AIDA — Artificial Intelligence Digital Academy

Web application for AIDA, built with Next.js 16 (App Router), React 19, TypeScript,
Tailwind CSS v4, Prisma 7 and PostgreSQL (Supabase in production).

## Getting started (local development)

```bash
npm install                 # also generates the Prisma client
npm run db:dev              # start a local PostgreSQL server (Prisma Dev) in the background
cp .env.example .env.local  # then fill in the values (see below)
npm run db:migrate          # apply database migrations
npm run dev                 # http://localhost:3000
```

For local development, `.env.local` can point at the Prisma Dev server:

```
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
DIRECT_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
IP_HASH_SALT="<random 64-char hex string>"
BETTER_AUTH_SECRET="<random 32+ char string>"
BETTER_AUTH_URL="http://localhost:3000"
SHADOW_DATABASE_URL="postgres://postgres:postgres@localhost:51215/template1?sslmode=disable"
```

Then create your first staff account with `npm run admin:create`.

## Deploying

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full Supabase + Vercel guide, environment variables and launch checklist.

## Connecting to Supabase

1. Create a Supabase project and open **Project Settings → Database → Connection string**.
2. Put the **Transaction pooler** URL (port 6543, add `?pgbouncer=true`) in `DATABASE_URL`.
3. Put the **Session pooler / direct** URL (port 5432) in `DIRECT_URL` — used for migrations.
4. Run `npm run db:deploy` to apply migrations to Supabase.

Credentials live only in environment variables (`.env.local` locally, the hosting
provider's settings in production). Database access happens exclusively on the server:
`src/lib/env.ts` and `src/lib/db.ts` import `server-only`, so the build fails if they
are ever pulled into browser code.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generate Prisma client and production build |
| `npm run lint` / `npm run typecheck` | Static checks |
| `npm test` | Unit tests + PostgreSQL integration tests (skipped if `DATABASE_URL` is unset) |
| `npm run db:dev` | Start local PostgreSQL (Prisma Dev) |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:studio` | Browse the database |
| `npm run admin:create` | Create a staff account / reset a password |
| `npm run db:cleanup` | Remove expired sessions and old rate-limit records |
| `npm run db:check` | Read-only connection check (`-- --supabase-file`, `-- --counts`) |
| `npm run supabase -- <cmd>` | Run a command against Supabase from `.env.supabase.local` |
| `npm run use-db -- supabase\|local` | Point `.env.local` at Supabase or the local database |

## Project structure

```
prisma/                    Schema and migrations
src/
  app/                     Routes: /, /about, /programmes, /register-interest, /contact, /privacy
  components/ui/           Design-system primitives (Button, Card, Badge, Field, Logo, …)
  components/layout/       Header, footer, navigation, page header
  components/home/         Homepage sections (also reused on inner pages)
  content/site.ts          All site copy in one place
  features/interest/       Register Interest: schema, service, Prisma repository, server action, form
  features/admin/          Admin area: auth, registrations, staff, audit log
  features/content/        Programmes and site details (admin editing + cached public reads)
  lib/                     env validation, Prisma client, utilities
tests/                     Vitest unit and integration tests
```

## Staff admin area (`/admin`)

Staff sign in at **/admin/sign-in**. There is no public sign-up: accounts are created from the command line.

```bash
npm run admin:create                      # prompts for email, name and password (hidden)
npm run admin:create -- --reset-password  # set a new password and sign the account out everywhere
```

- **Dashboard**: totals by status, registrations per day (30 days), breakdown by how registrants describe themselves.
- **Registrations**: search (name/email), filter by status and type, pagination, detail view, status changes, internal notes, CSV export of the current filter, permanent deletion (reason + typed confirmation).
- **Audit log**: every sign-in (including failures), sign-out, status change, note, export and deletion. Entries hold no registrant personal data, so they survive deletion requests.

Security model:

- Authentication: [Better Auth](https://www.better-auth.com) with email + password, stored in our own PostgreSQL. Passwords are hashed (scrypt); sessions are database-backed httpOnly cookies that expire after 8 hours.
- Authorisation: `requireAdmin()` (`src/features/admin/session.ts`) runs in every admin page, server action and route handler. `src/proxy.ts` only redirects visitors without a session cookie early; it is not the security boundary.
- Sign-in throttling: 5 failed attempts per email or 20 per IP within 15 minutes locks further attempts. Error messages never reveal whether an account exists.
- Disabled accounts (`users.disabled = true`) cannot sign in or use existing sessions.
- CSV exports neutralise spreadsheet formula injection.

## Content managed by staff

Verified information is entered by AIDA staff in the admin area; nothing is hard-coded.

- **Programmes** (`/admin/programmes`): create, edit, publish/unpublish, delete. Drafts are never shown publicly.
  A programme needs a summary and overview before it can be published; empty detail fields display “To be confirmed”.
  Published programmes appear in the catalogue (`/programmes`, homepage) and at `/programmes/<web-address>`.
- **Site details** (`/admin/site`): official email, phone, address and About-page sections, plus the
  “development preview” notice. Edits are saved as a draft and appear on the site only after “Save and publish”.
  Empty fields keep their public “to be published” placeholder.
- **Staff** (`/admin/staff`): add staff (a one-time temporary password is shown once), reset passwords,
  disable/re-enable accounts (disabling signs the person out immediately). You cannot disable yourself or the
  last active account. Everyone can change their own password under **My account**.
- **Register Interest** lets people optionally pick a published programme (`/register-interest?programme=<web-address>`
  pre-selects it); admins can filter registrations and exports by programme.

Public pages read published content through cached functions (`src/features/content/queries.ts`) tagged per
content type; every admin change calls `updateTag`, so the next page regeneration shows it. Note that the
**production build needs database access** (`DATABASE_URL`) because public pages are prerendered from published content.

## AIDA knowledge base

The verified AIDA information (13 sections: About AIDA, Founder Profile, AI Training Programme, Duration and
Schedule, Curriculum, Fees and Payment, Admission, Requirements, Student Support, Certificates, Refund Policy,
FAQs, Contact and Reception) lives in two places:

- **`knowledge/aida/*.md`** — the version-controlled source (one file per section: front matter `key`, `title`,
  `order`, `page`, `summary` = the assistant's short answer; then the full Markdown body). The original document
  is kept in `knowledge/source/`.
- **Database tables `knowledge_sections` and `knowledge_revisions`** — the live copy. `npm run kb:seed` copies
  the files in **only for sections that don't exist yet** (it never overwrites staff edits) and adds the FAQ
  questions from section 12 as published FAQ entries (skipping existing questions).

**To update information (no code changes):** sign in → **Admin → Knowledge base** → choose a section → edit the
title, short answer or full content → describe the change → Save. The website pages (`/about`, `/founder`,
`/programme`, `/curriculum`, `/fees-admission`, `/contact`) and Ask AIDA update immediately. Every save is kept in
the section's **version history** with a **Restore** button, so verified information is never lost. To make a
change permanent in the repository too, edit the matching `knowledge/aida/*.md` file and commit it.

## Ask AIDA assistant and FAQ

- **Ask AIDA** (floating assistant with the AIDA avatar `public/images/ask-aida-assistant.svg`, bottom-right on
  every public page; the chat is kept while moving between pages, with New chat and Close controls) answers
  visitors' questions using **only the knowledge base and published content**. It never invents fees, dates or
  programmes.
- Greetings in English, Urdu and Roman Urdu (Assalam-o-Alaikum, Salam, Hi, Good morning, السلام علیکم …) always
  get: "Aslamoalikum! Welcome to AIDA. How can I help you today?"
- **FAQ mode** (`src/features/assistant/offline.ts`) matches questions by meaning — synonyms, spelling variants,
  Roman Urdu and Urdu keywords — to a knowledge-base section's short answer plus a page link, or to a published
  FAQ entry. If nothing matches it says so and gives AIDA Reception's details.
- **AI mode** (`ANTHROPIC_API_KEY` set): Claude (`claude-opus-5-5`, low effort, prompt-cached knowledge,
  server-side refusal fallback). **FAQ mode** (no key, or if the AI provider is unavailable): answers from matching
  FAQ entries, otherwise honest guidance. Either way the assistant always works.
- `POST /api/assistant` accepts same-origin requests only; 20 questions per 10 minutes per visitor (hashed IP);
  conversations are stored for 30 days (pruned by the daily job) and readable in **Admin → Assistant**.
- **Admin → FAQ**: create, edit, publish/unpublish and delete questions; published ones appear at `/faq`, on the
  homepage and in the assistant's knowledge. `npm run db:seed-faq` adds six starter entries (about how the site
  works) only when the FAQ is empty. **Admin → Site details** can switch the assistant off.

## Email

- New registrations get a confirmation email restating that registering is **not** an admission application.
- Staff choose under **My account**: instant alerts (name, type and programme only; no contact details),
  a daily summary (counts only), or no emails.
- Every email is stored first in an outbox (`email_messages`), delivered after the response is sent,
  and retried by the daily job (up to 5 attempts). **Admin → Emails** shows each message's status and a preview.
- Without `EMAIL_PROVIDER=resend` the site runs in **preview mode** and nothing is sent (see DEPLOYMENT.md).
- Deleting a registration deletes its emails; email records are removed after 30 days.

## Security and operations

- Security headers on every response: Content Security Policy (same-origin only), HSTS (production),
  X-Frame-Options DENY, nosniff, strict referrer and permissions policies; admin pages are `no-store`.
- `GET /api/health` checks the database (for uptime monitors).
- `GET /api/cron/daily` runs daily housekeeping when called with `Authorization: Bearer $CRON_SECRET`
  (configured in `vercel.json`).
- Search engines are blocked (`robots.txt` and meta tags) unless `ALLOW_SEARCH_INDEXING=true`.
- `/sitemap.xml` lists public pages and published programmes; a branded social-sharing image is generated.

## Register Interest — protections

- **Server-side validation** with Zod (the browser form has `noValidate`; the server is the authority).
- **Spam protection**: hidden honeypot field and a minimum form-fill time; spam receives a normal-looking response and is not stored.
- **Rate limiting**: max 5 submissions per 15 minutes per visitor, keyed on a salted SHA-256 hash of the IP (raw IPs are never stored).
- **Duplicate controls**: one record per (normalised) email address; a per-form token makes double-clicks and replays idempotent; repeat submissions within 10 minutes are not re-counted. Responses never reveal whether an email is already registered.
- Registering interest is explicitly **not** an admission application — stated on the form, the success message, the CTAs and the privacy notice.

## Content policy

No verified AIDA programme, fee, contact or institutional information has been supplied yet.
Copy in `src/content/site.ts` is neutral draft text; draft sections are labelled in the UI and
a site-wide preview notice is shown while `site.preview` is `true`. The privacy notice is a draft
pending legal review. Do not add invented courses, fees, dates, contact details or statistics.
