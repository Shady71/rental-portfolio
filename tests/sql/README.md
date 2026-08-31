# SQL test suite (RLS & schema)

These scripts test the database directly: Row Level Security policies, the
signup trigger, check/unique constraints, and cascade behavior. They're
meant to be run by hand in the **Supabase Dashboard → SQL Editor**, one
section at a time. Nothing here is run automatically, and nothing connects
to your database on your behalf — you run these yourself.

## Files

| File | Covers | Impersonates users? |
| --- | --- | --- |
| `01_cross_landlord.sql` | A-01…A-03 | Yes |
| `02_tenant_boundaries.sql` | A-04, A-05, A-06, A-09, A-10 | Yes |
| `03_profile_role_security.sql` | A-07, A-08 | Yes |
| `04_anonymous_and_rpc.sql` | A-11, A-12 | Yes (`anon` / tenant) |
| `05_triggers_and_constraints.sql` | D-01…D-04 | No — runs as the default SQL Editor connection |
| `06_cascades_and_rls_coverage.sql` | D-05…D-07 | No — runs as the default SQL Editor connection |

The `A-*` tests check per-user authorization (RLS), so each one impersonates
a specific app user via `set local role` + `set local request.jwt.claims`.
The `D-*` tests check schema-level guarantees that apply no matter who's
asking (triggers, constraints, cascades), so they deliberately run as the
SQL Editor's own connection instead.

## Safety: nothing here persists

Every section is wrapped in `begin; ... rollback;`. Any fixture rows a
section creates (throwaway properties, charges, even a throwaway
`auth.users` row in D-01/D-06) are rolled back at the end regardless of
whether the test passed or failed. This means:

- these are safe to run against a real database, including one with your
  own live data in it — nothing is added, changed, or removed permanently;
- each section is independent and repeatable — run them in any order, any
  number of times, without cleaning up after yourself.

Two exceptions have no rollback because they're pure reads with nothing to
undo: D-07 (checks `pg_class` metadata) and the plain `select` lines in the
tenant-boundary tests happen *inside* their transaction's rollback too, so
even those are fully undone.

## Positive controls (avoiding a false pass)

Several tests assert "0 rows" or a specific error as the pass condition —
but that's also exactly what you'd see if impersonation silently failed
(a malformed claim, a typo'd placeholder id, the role switch not taking
effect): every RLS policy would deny everything, and the test would look
like it passed while proving nothing. Two things guard against that:

- **Every query returns `auth.uid()`** alongside the real assertion, so you
  can confirm the session is actually impersonating who you think it is —
  compare it against the `-- Expected: ...` comment.
- **Every isolation check is paired with a positive control** — proof the
  impersonated user *can* see or do something equivalent to their own data,
  in the same query where possible (e.g. A-01 checks Landlord B's own
  property alongside Landlord A's, in one `select`; A-02/A-03 target both
  properties in one `update`/`delete` and let `RETURNING` show which one(s)
  actually matched). If a positive control reads 0 (or an `update`/`delete`
  returns 0 rows total), that means impersonation itself is broken — the
  isolation result next to it isn't meaningful evidence of anything.

Where the real assertion is an expected **error** (an `insert` or RPC call
that should fail), there's no result set to combine the positive control
into, so it runs as a separate preceding block instead — labeled
`(sanity check)` — meant to be run on its own, before the block that
expects the error, so its result isn't overshadowed by the error banner
that follows.

**A second false-pass source, specific to expected errors:** an earlier
version of `02_tenant_boundaries.sql` used a temporary table to carry a
fixture's id across the `set local role authenticated` switch. A temp
table is owned by the session's original (superuser) role, and
`authenticated` has no grant on it — reading it back after the switch
fails with `42501: permission denied for table tmp_xxx`. That's the same
SQLSTATE an RLS denial produces, so the test would show the "right" error
code while proving nothing about the actual policy. Fixed by never
carrying a fixture id through a temp table across a role switch — instead,
each fixture id is re-selected from the real table post-switch, through a
SELECT policy the impersonated user genuinely has, so the only thing left
that can fail is the specific INSERT under test. This is why every
expected-error test's comment now states the **exact error message**
(not just the SQLSTATE) plus a **FALSE PASS WARNING**: if the error names
a different object than the one stated — a temp table, or any table/column
other than the one under test — the test didn't exercise what it claims
to, regardless of the SQLSTATE matching.

## How to run a section

1. Open **Supabase Dashboard → SQL Editor → New query**.
2. Paste one file, or just the section you want (each is delimited by a
   `-- ==== A-NN: ... ====` banner and is independently runnable). A few
   test ids have two banners — `(sanity check)` and the plain id — run the
   sanity check first, as described above.
3. Replace every `{{PLACEHOLDER}}` token with a real value (see below) —
   keep the surrounding quotes, just swap the token text inside them.
4. Click **Run**.
5. Read the result:
   - A test expecting **rows** shows them in the Results grid — compare the
     row count/content against the `-- Expected: ...` comment above the
     query.
   - A test expecting an **error** shows a red error banner with a
     SQLSTATE code (e.g. `42501`, `23505`, `23514`, `P0001`) and a message
     — that error *is* the pass condition, not a bug. Compare the code
     against the `-- Expected: ...` comment.

## Placeholders and how to get them

You need 3 user ids and 2 property ids, all from real accounts you create
through the app itself (not inserted manually — except the throwaway rows
D-01/D-06 create and discard internally).

**Setup, once:**

1. Sign up two landlord accounts through the app (`/signup`, role =
   Landlord). Call them Landlord A and Landlord B.
2. Sign up one tenant account (`/signup`, role = Tenant). Call them Tenant A.
3. As Landlord A, add a property (`/dashboard/properties/new`), then assign
   Tenant A to it from that property's page (the "Tenant" section).
4. As Landlord B, add a second property. Leave it unassigned.

**Finding the ids:** run this once in the SQL Editor (as the default
connection, no impersonation needed) and keep the output handy:

```sql
select p.id as user_id, p.role, p.full_name, u.email
from public.profiles p
join auth.users u on u.id = p.id
order by p.role, u.email;

select id as property_id, owner_id, tenant_id, address
from public.properties
order by created_at;
```

Or via the Dashboard UI: **Authentication → Users** for each account's id
(the UUID shown in the table), and the properties list/detail pages in the
app itself for property ids (visible in the URL, e.g.
`/dashboard/properties/<id>`).

Map them to the placeholders used across these files:

| Placeholder | What it is |
| --- | --- |
| `{{LANDLORD_A_ID}}` | Landlord A's user id |
| `{{LANDLORD_B_ID}}` | Landlord B's user id |
| `{{TENANT_A_ID}}` | Tenant A's user id |
| `{{LANDLORD_A_PROPERTY_ID}}` | Landlord A's property — **Tenant A must be assigned to it** |
| `{{LANDLORD_B_PROPERTY_ID}}` | Landlord B's property — **Tenant A must NOT be assigned to it** |

That's still the full set — the positive controls above reuse these same
five tokens (e.g. `{{LANDLORD_B_PROPERTY_ID}}` is now also used in
`01_cross_landlord.sql`, and `{{LANDLORD_A_ID}}` in `04_anonymous_and_rpc.sql`),
no new placeholder was needed.

## A note on `auth.users` inserts (D-01, D-06)

Two tests need a real row in `auth.users` to exercise the `handle_new_user`
trigger and the cascade it participates in — there's no way to test a
trigger on that table without inserting into it. Both wrap the insert in
`begin; ... rollback;`, so the row (and everything it cascades to) is
discarded immediately after the test reads its result, never actually
persisting. Supabase's `auth.users` schema has a couple of columns that can
vary slightly between project versions; if an insert errors naming a
column not in the script, add it with any placeholder value and re-run —
the rollback discards it regardless.
