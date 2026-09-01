# Test suite

Three independent layers, each testing a different boundary:

| Layer | What it tests | Where |
| --- | --- | --- |
| Unit (Vitest) | Pure functions in `lib/` — status derivation, aggregation, formatting, validation | `tests/unit/` |
| SQL (manual) | Row Level Security policies, the signup trigger, constraints, cascades | `tests/sql/` |
| E2E (Playwright) | Real user flows through the actual UI, against a real dev server + Supabase backend | `tests/e2e/` |

## Unit tests

```
npm run test        # watch mode
npm run test:run     # single run
```

No setup needed — these are pure functions, no database or server involved.

## SQL tests

Not automated — these are scripts you run yourself in the Supabase SQL
Editor, one section at a time. See **`tests/sql/README.md`** for the full
guide: what each script needs, how to get the placeholder ids, and how to
read a pass/fail result.

## E2E tests (Playwright)

```
npm run test:e2e
```

This drives a real browser against `next dev` on `localhost:3000` (started
automatically if nothing's already running there) and logs in as real,
already-confirmed accounts — **it exercises your actual configured Supabase
backend**, the same one `.env.local` points at.

### Setup: accounts

Email confirmation is on, so tests can't sign up new accounts (there's no
inbox to click through). You need existing, already-confirmed accounts,
created once through the app itself:

| Env vars | Account needs | Used by |
| --- | --- | --- |
| `TEST_LANDLORD_EMAIL` / `TEST_LANDLORD_PASSWORD` | A landlord with at least one **occupied** property | Most tests |
| `TEST_TENANT_EMAIL` / `TEST_TENANT_PASSWORD` | A tenant **assigned** to one of that landlord's properties | E-03 |
| `TEST_EMPTY_LANDLORD_EMAIL` / `TEST_EMPTY_LANDLORD_PASSWORD` *(optional)* | A landlord with **zero** properties, ever | X-04 |
| `TEST_UNASSIGNED_TENANT_EMAIL` / `TEST_UNASSIGNED_TENANT_PASSWORD` *(optional)* | A tenant with **no** property assignment | X-05 |

If you already set up "Landlord A" and "Tenant A" for the SQL test suite
(`tests/sql/README.md`), those satisfy the first two rows — reuse them.

The two optional accounts only matter for X-04/X-05, which **skip cleanly**
if their env vars are absent — the rest of the suite runs fully without them.

### Setup: credentials file

```
cp .env.test.example .env.test
```

Fill in the real emails/passwords. `.env.test` is gitignored — **never
commit it**. Login itself is handled once by a Playwright "setup" project
(`tests/e2e/auth.setup.ts`), which saves each account's session to
`tests/e2e/.auth/*.json` (also gitignored — these are live session
cookies); every test then reuses the saved session via a fixture instead of
logging in itself.

### What's covered

- **E-01, E-02, E-03** — core flows: property CRUD, generate-charges →
  record-payment → paid, tenant files a ticket → landlord advances +
  notes → tenant sees it.
- **B-03…B-06** — rent-charge edge cases: no duplicate charges, vacant
  properties get none, partial payments, deleting the only payment reverts
  status.
- **X-03…X-06, X-08** — future-dated expenses excluded from current-month
  totals, empty states, pagination boundaries.
- **UI-01, UI-02, UI-04, UI-06, UI-07** — auth redirects, form validation,
  empty-state rendering, logout.

### Determinism and cleanup

Every test that creates a property creates its own (named `[E2E] <spec-id>
...` with a timestamp) and deletes it in a `finally` block, regardless of
whether the test passed — re-running the suite doesn't accumulate junk.
`X-08` dynamically creates only as many filler properties as needed to
reach a second page, and cleans up exactly those.

**One exception: E-03's maintenance ticket cannot be cleaned up.**
`maintenance_tickets` and `ticket_updates` are append-only by design — no
delete policy exists on either table, and the app has no delete UI for
them (see `supabase/schema.sql`). E-03 will leave one ticket and one note
behind on every run, clearly named with the `[E2E]` prefix so they're easy
to spot and safe to ignore, or prune manually via the SQL Editor if you
want to. This isn't a workaround I could avoid without either weakening
the schema (adding a delete policy that isn't otherwise wanted) or bypassing
the UI to clean up via direct SQL from the test itself — both out of scope
for a black-box E2E suite.

### A finding surfaced while fixing UI-04

The property **create** form (`/dashboard/properties/new`) does not
preserve typed input after a failed submission. Confirmed against the real
app: submitting a whitespace-only address (which passes the browser's
`required` check but fails `validateAddress` server-side) correctly shows
"Address is required.", but **both** the address and monthly-rent fields
reset to empty afterward — not just the errored field. The create form's
inputs have no `defaultValue` tied to the just-submitted values (only the
**edit** form binds `defaultValue` to the server-loaded record), so React
resets these uncontrolled fields once the Server Action settles. A
landlord who mistypes one field on a new property currently has to
re-enter everything. `UI-04` no longer asserts values are preserved, since
they aren't — it only asserts the error text renders and nothing was
created. Fixing this (e.g., having `PropertyFormState` echo back the
submitted values so the form can bind `defaultValue` to them on error)
would be an app-code change, not a test change — flagging it rather than
making it unasked.

### Route guards and query filters

`app/dashboard/layout.tsx` and `app/portal/page.tsx` each read the caller's
own `profiles.role` (via an explicit `.eq('id', <own id>)` — never an
unfiltered query, since RLS lets a landlord read their tenants' profiles
and a tenant read their landlord's, which would otherwise risk matching
more than one row) and redirect a tenant away from `/dashboard` to
`/portal`, and a landlord away from `/portal` to `/dashboard`. RLS remains
the real security boundary underneath (defense-in-depth, not the only
line): `app/dashboard/page.tsx`'s properties query now has an explicit
`.eq('owner_id', ...)` filter, and `app/portal/page.tsx`'s property query
has an explicit `.eq('tenant_id', ...)` filter, rather than relying solely
on RLS to scope the result. `UI-02` verifies both redirect directions.

### Known limitations

- **Serial only.** `workers: 1` in `playwright.config.ts` — tests mutate
  shared, real seeded accounts, so parallelism would race. This makes the
  suite slower but avoids flakiness from cross-test interference.
- **Real backend, real clock.** A few date-boundary assertions (current
  month) compute "today" in UTC to match `lib/rent.ts`'s own logic; a test
  run within seconds of a UTC month boundary is a (very) rare theoretical
  flake source.
- **Not run by me.** I don't have credentials for your Supabase project, so
  I verified this suite compiles clean (`tsc`, `eslint`) and that
  `npx playwright test --list` resolves all 22 tests (18 across the 17
  specs — UI-01 covers two sub-cases — plus the 4 setup logins) with no
  structural errors — but I have
  not executed it against a live backend. Once you've set up the accounts
  and `.env.test` above, run `npm run test:e2e` and let me know what you
  see.
