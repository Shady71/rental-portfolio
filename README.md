# Property Manager

A portfolio management web app for individual real-estate investors — track rent, expenses, cash flow, and maintenance across a small rental portfolio in one place.

**Live app:** https://assetmanager-liard.vercel.app

**Repository:** https://github.com/Shady71/rental-portfolio

Built with Next.js (App Router) · TypeScript · Supabase (PostgreSQL + Auth) · Vercel.

---

## What it does

Landlords manage their properties, generate monthly rent charges, record payments, log expenses, and see portfolio-wide cash flow on a dashboard. Tenants get a read-only view of their own rent and can file maintenance requests, which the landlord works through a lifecycle with progress notes the tenant can follow.

Every user's data is isolated at the database level by PostgreSQL Row-Level Security — no user can read or modify another user's records, even bypassing the UI.

---

## Prerequisites

- **Node.js 20.9 or later**
- **npm** (ships with Node)
- A **Supabase** account — the free tier is sufficient

---

## Running locally

### 1. Clone and install

```bash
git clone https://github.com/Shady71/rental-portfolio.git
cd rental-portfolio
npm install
```

### 2. Create a Supabase project

Create a new project at [supabase.com](https://supabase.com). Any region works; choose one near you for lower latency.

### 3. Set up the database

Open your project's **SQL Editor**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates:

- all seven tables (`profiles`, `properties`, `rent_charges`, `payments`, `expenses`, `maintenance_tickets`, `ticket_updates`)
- the indexes and constraints
- Row-Level Security policies on every table
- the `handle_new_user` signup trigger and the `find_tenant_by_email` lookup function

### 4. Configure authentication

In the Supabase dashboard:

- **Authentication → Sign In / Providers → Email** — enable the email provider. Leave **Confirm email** on to require verification (recommended); turn it off if you want test accounts to sign in immediately without a real inbox.
- **Authentication → URL Configuration** — set:
  - **Site URL:** `http://localhost:3000`
  - **Redirect URLs:** add `http://localhost:3000/**`

  (In production these point at the deployed domain instead.)

### 5. Add environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Both values come from **Project Settings → API** in the Supabase dashboard. See [Environment variables](#environment-variables) below for what each one is.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up as a landlord to get started; sign up a second account as a tenant to see both sides of the app.

---

## Environment variables

| Variable | Required | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project's API URL, e.g. `https://abcdefgh.supabase.co`. Tells the app which database to talk to. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | The Supabase publishable (anon) key. Identifies the project to the API. |

**On the `NEXT_PUBLIC_` prefix and safety.** Both variables are exposed to the browser by design — that is what the prefix means. This is safe because the publishable key grants no privileges on its own: it identifies the project, and Row-Level Security decides what the authenticated user may actually read or write. Access control lives in the database, not in the key.

The **service-role key is not used anywhere in this project**. It bypasses RLS entirely and must never be placed in a `NEXT_PUBLIC_` variable or in client-reachable code.

**Secrets are never committed.** `.env*` files are git-ignored; `.env.test.example` is committed as a template documenting the variable names, with no real values.

### Production (Vercel)

`.env.local` is local-only and is not deployed. Set the same two variables in **Vercel → Project → Settings → Environment Variables**, then update Supabase's **Site URL** and **Redirect URLs** to the deployed domain (e.g. `https://your-app.vercel.app` and `https://your-app.vercel.app/**`) so login and email confirmation work in production.

---

## Testing

The suite has three layers. See [`tests/README.md`](tests/README.md) for detail.

### Unit tests (Vitest)

Pure business logic — rent status derivation, portfolio aggregation, input validation, currency and date helpers.

```bash
npm run test:run     # single run
npm run test         # watch mode
```

### Database & authorization tests (SQL)

Row-Level Security and schema constraints — two different things, verified two different ways.

- **A-series (authorization):** impersonates a real, authenticated user via `set local role` + a JWT claim, because the SQL Editor's default role bypasses RLS entirely and would prove nothing about who can see what.
- **D-series (schema — triggers, constraints, cascades):** deliberately runs as the SQL Editor's own default connection instead, since these check guarantees that hold no matter who's asking. D-01 and D-06 specifically must *not* impersonate — they insert into `auth.users` directly, which requires the default connection's privileges.

Run the files in [`tests/sql/`](tests/sql/) one section at a time in the Supabase SQL Editor. Only the A-series files have `{{...}}` placeholders to substitute with real ids — see [`tests/sql/README.md`](tests/sql/README.md) for how to get them. Every *writing* test is wrapped in `begin; ... rollback;` so nothing persists; D-07 is the one read-only exception (it just checks that RLS is enabled on every table).

### End-to-end tests (Playwright)

Core user flows through the real UI.

```bash
cp .env.test.example .env.test    # then fill in credentials
npm run test:e2e
```

E2E tests sign in as **existing, already-confirmed accounts** (they cannot complete email confirmation), so `.env.test` needs:

- `TEST_LANDLORD_EMAIL` / `TEST_LANDLORD_PASSWORD` — a landlord with at least one occupied property
- `TEST_TENANT_EMAIL` / `TEST_TENANT_PASSWORD` — a tenant assigned to one of that landlord's properties
- Optionally `TEST_EMPTY_LANDLORD_*` and `TEST_UNASSIGNED_TENANT_*` for the empty-state tests; those tests skip cleanly if unset

`.env.test` and the saved session states in `tests/e2e/.auth/` are git-ignored — they hold real credentials and live session cookies.

---

## Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Production build (stricter than dev — run before deploying) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests in watch mode |
| `npm run test:run` | Unit tests, single run |
| `npm run test:e2e` | Playwright end-to-end tests |

---

## Project structure

```
app/                      Routes, pages, and Server Actions (Next.js App Router)
  auth/callback/          Email-confirmation route handler
  dashboard/              Landlord: dashboard, properties, rent, maintenance
  portal/                 Tenant portal
  login/ signup/ logout/  Authentication
components/               Shared UI components (forms, sections, badges)
lib/                      Pure business logic — rent, portfolio, validation, currency
public/                   Static assets served at the site root
utils/supabase/           Supabase clients (browser, server, middleware)
supabase/schema.sql       Database schema, RLS policies, trigger, function
tests/unit/               Vitest unit tests
tests/sql/                SQL authorization and database tests
tests/e2e/                Playwright end-to-end tests
proxy.ts                  Request middleware — refreshes the auth session
```

> **Note on `proxy.ts`:** in this version of Next.js the middleware convention is named `proxy.ts` rather than `middleware.ts`; the older name is deprecated.

---

## Deployment

The app deploys to Vercel from the `main` branch — every push triggers a build and deploy.

1. Import the GitHub repository in Vercel (framework is auto-detected as Next.js).
2. Add the two environment variables above under **Settings → Environment Variables**.
3. Deploy, then set Supabase's **Site URL** and **Redirect URLs** to the deployed domain.

---

## Documentation

Project documents live alongside this repository:

- Product Specification
- Software Architecture
- Technical Design
- Test Specification
- Security
- Scale
