-- =============================================================
-- A-04, A-05, A-06, A-09, A-10 — tenant access boundaries
-- Run one section at a time (select its text, or run the whole file).
-- Placeholders (replace the {{...}} tokens, keep the quotes):
--   {{TENANT_A_ID}}            -- Tenant A's auth user id
--   {{LANDLORD_A_ID}}          -- Landlord A's auth user id
--   {{LANDLORD_A_PROPERTY_ID}} -- Landlord A's property, Tenant A ASSIGNED to it
--   {{LANDLORD_B_PROPERTY_ID}} -- Landlord B's property, Tenant A NOT assigned to it
-- See tests/sql/README.md for how to obtain these.
-- Every section is wrapped in begin/rollback: nothing here persists,
-- including any fixture rows a section creates.
--
-- Every query returns auth.uid() alongside the real assertion, and every
-- isolation check (something the tenant should NOT see) is paired with a
-- positive control (something equivalent the tenant SHOULD see) so a
-- silently-broken impersonation can't produce a false pass. Tests whose
-- final assertion is an expected ERROR (no result set to combine with a
-- positive control) get a separate preceding sanity block instead, run
-- on its own so its result isn't overshadowed by the later error.
--
-- No temporary tables are used to pass a fixture's id across the
-- `set local role authenticated` switch: a temp table is owned by the
-- session's original (superuser) role, and `authenticated` has no grant
-- on it — reading it back post-switch fails with 42501, the SAME code
-- an RLS denial produces. That would be a false pass: the error is real,
-- but it says nothing about the policy under test. Instead, each fixture
-- id is re-selected from the real table post-switch, through a SELECT
-- policy the tenant genuinely has (own property's charges/tickets), so
-- the only thing that can still fail is the actual INSERT under test.
-- =============================================================

-- ============ A-04: tenant cannot read another property's charges ============
-- Expected: impersonated_as = {{TENANT_A_ID}}, own_property_charges_visible = 1,
-- other_landlords_charges_visible = 0.
--   impersonated_as null, or own_property_charges_visible = 0 ->
--     impersonation is broken; the 0 below is not proof of isolation.
--   other_landlords_charges_visible > 0 -> isolation is broken.
begin;

insert into public.rent_charges (property_id, period, amount_due, due_date)
values
  ('{{LANDLORD_A_PROPERTY_ID}}', '2026-01-01', 1800, '2026-01-10'),
  ('{{LANDLORD_B_PROPERTY_ID}}', '2026-01-01', 2000, '2026-01-10');

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

select
  auth.uid() as impersonated_as,
  (select count(*) from public.rent_charges where property_id = '{{LANDLORD_A_PROPERTY_ID}}') as own_property_charges_visible,
  (select count(*) from public.rent_charges where property_id = '{{LANDLORD_B_PROPERTY_ID}}') as other_landlords_charges_visible;

rollback;

-- ============ A-05 (sanity check): impersonation is in effect, and ============
-- ============ the tenant can read their own rent charge             ============
-- Run this first, on its own, so its result is visible before the
-- expected-error block below (an error would otherwise overshadow it).
-- Expected: impersonated_as = {{TENANT_A_ID}}, own_charge_visible = 1.
begin;

insert into public.rent_charges (property_id, period, amount_due, due_date)
values ('{{LANDLORD_A_PROPERTY_ID}}', '2026-01-01', 1500, '2026-01-10');

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

select
  auth.uid() as impersonated_as,
  (select count(*) from public.rent_charges where property_id = '{{LANDLORD_A_PROPERTY_ID}}') as own_charge_visible;

rollback;

-- ============ A-05: tenant cannot insert payments ============
-- Only meaningful once the sanity check above confirms impersonation
-- actually works. Tested against the tenant's OWN assigned property's
-- charge, to isolate "no INSERT policy for tenants" from "wrong
-- property." The charge id is found via a SELECT the tenant genuinely
-- has (their own property's charges), post role-switch — not a temp
-- table — so the only thing that can fail here is the payments INSERT.
-- Expected: ERROR 42501 — "new row violates row-level security policy
-- for table \"payments\"".
-- FALSE PASS WARNING: if the error instead names anything other than
-- "payments" (e.g. a temp table, or "rent_charges"), this did not test
-- what it claims to — check the placeholder ids and re-run. Likewise,
-- if this produces NO error and inserts 0 rows silently, the SELECT
-- below found no charge at all (bad placeholder, or Tenant A isn't
-- really assigned to this property) — not a passing test either way.
begin;

insert into public.rent_charges (property_id, period, amount_due, due_date)
values ('{{LANDLORD_A_PROPERTY_ID}}', '2026-01-01', 1500, '2026-01-10');

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

insert into public.payments (rent_charge_id, amount, method)
select id, 500, 'manual'
from public.rent_charges
where property_id = '{{LANDLORD_A_PROPERTY_ID}}'
order by created_at desc
limit 1;

rollback;

-- ============ A-06: tenant cannot read expenses ============
-- Expected: impersonated_as = {{TENANT_A_ID}}, own_property_visible = 1
-- (positive control: the tenant CAN see their own property record — so
-- impersonation and RLS are genuinely working), own_property_expenses_visible
-- = 0 (expenses are landlord-only by design, even though this expense
-- genuinely exists on the tenant's own property).
--   impersonated_as null, or own_property_visible = 0 -> impersonation
--     is broken; the 0 below is not proof of isolation.
begin;

insert into public.expenses (property_id, amount, category, incurred_on)
values ('{{LANDLORD_A_PROPERTY_ID}}', 250, 'maintenance', current_date);

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

select
  auth.uid() as impersonated_as,
  (select count(*) from public.properties where id = '{{LANDLORD_A_PROPERTY_ID}}') as own_property_visible,
  (select count(*) from public.expenses where property_id = '{{LANDLORD_A_PROPERTY_ID}}') as own_property_expenses_visible;

rollback;

-- ============ A-09 (sanity check): tenant can see their own property ============
-- Run this first, on its own. Expected: impersonated_as = {{TENANT_A_ID}},
-- own_property_visible = 1.
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

select
  auth.uid() as impersonated_as,
  (select count(*) from public.properties where id = '{{LANDLORD_A_PROPERTY_ID}}') as own_property_visible;

rollback;

-- ============ A-09: tenant cannot file a ticket on another property ============
-- Only meaningful once the sanity check above confirms impersonation
-- actually works.
-- Expected: ERROR 42501 — "new row violates row-level security policy
-- for table \"maintenance_tickets\"".
-- FALSE PASS WARNING: if the error names anything other than
-- "maintenance_tickets" (e.g. a temp table), this did not test what it
-- claims to — check the placeholder ids and re-run.
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

insert into public.maintenance_tickets (property_id, created_by, title)
values ('{{LANDLORD_B_PROPERTY_ID}}', '{{TENANT_A_ID}}', 'A-09 test: not my property');

rollback;

-- ============ A-10 (sanity check): tenant can read updates on their ============
-- ============ own property's ticket (positive control)              ============
-- Run this first, on its own, before testing that they still can't
-- POST one themselves. Scoped to the most-recently-created ticket on
-- this property (our fixture, inserted just above) rather than a temp
-- table, to avoid the same post-role-switch read failure — and rather
-- than counting every ticket_update ever filed on this property, which
-- could include unrelated pre-existing data.
-- Expected: impersonated_as = {{TENANT_A_ID}}, own_ticket_update_visible = 1.
begin;

insert into public.maintenance_tickets (property_id, created_by, title)
values ('{{LANDLORD_A_PROPERTY_ID}}', '{{LANDLORD_A_ID}}', 'A-10 sanity fixture ticket');

insert into public.ticket_updates (ticket_id, author_id, body)
select mt.id, '{{LANDLORD_A_ID}}', 'Landlord note, for A-10''s positive control'
from public.maintenance_tickets mt
where mt.property_id = '{{LANDLORD_A_PROPERTY_ID}}'
order by mt.created_at desc
limit 1;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

select
  auth.uid() as impersonated_as,
  (
    select count(*)
    from public.ticket_updates tu
    where tu.ticket_id = (
      select mt.id from public.maintenance_tickets mt
      where mt.property_id = '{{LANDLORD_A_PROPERTY_ID}}'
      order by mt.created_at desc
      limit 1
    )
  ) as own_ticket_update_visible;

rollback;

-- ============ A-10: tenant cannot post a progress note ============
-- Only meaningful once the sanity check above confirms impersonation
-- actually works. There is no tenant-facing INSERT policy on
-- ticket_updates at all (it's landlord-post, tenant-read-only by
-- design), so this fails even on the tenant's own ticket. The ticket
-- id is found via a SELECT the tenant genuinely has (their own
-- property's tickets), post role-switch — not a temp table — so the
-- only thing that can fail here is the ticket_updates INSERT.
-- Expected: ERROR 42501 — "new row violates row-level security policy
-- for table \"ticket_updates\"".
-- FALSE PASS WARNING: if the error instead names anything other than
-- "ticket_updates" (e.g. a temp table, or "maintenance_tickets"), this
-- did not test what it claims to — check the placeholder ids and
-- re-run. Likewise, if this produces NO error and inserts 0 rows
-- silently, the SELECT below found no ticket at all — not a passing
-- test either way.
begin;

insert into public.maintenance_tickets (property_id, created_by, title)
values ('{{LANDLORD_A_PROPERTY_ID}}', '{{LANDLORD_A_ID}}', 'A-10 fixture ticket');

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

insert into public.ticket_updates (ticket_id, author_id, body)
select mt.id, '{{TENANT_A_ID}}', 'A-10 test: tenant attempting a note'
from public.maintenance_tickets mt
where mt.property_id = '{{LANDLORD_A_PROPERTY_ID}}'
order by mt.created_at desc
limit 1;

rollback;
