-- =============================================================
-- D-05 .. D-07 — cascade deletes and RLS coverage
-- Run one section at a time (select its text, or run the whole file).
--
-- D-05 and D-06 test schema-level guarantees, not per-user
-- permissions, so they run as the SQL Editor's default connection —
-- do NOT add `set local role authenticated` here. D-06 deletes an
-- auth.users row directly, same caveat as D-01 in the previous file.
--
-- Placeholder (replace the {{...}} token, keep the quotes):
--   {{LANDLORD_A_ID}} -- Landlord A's auth user id (used as owner_id
--                        for throwaway fixture properties)
-- See tests/sql/README.md for how to obtain this.
-- Every section is wrapped in begin/rollback: nothing here persists.
-- =============================================================

-- ============ D-05: deleting a property cascades to its children ============
-- Expected: a single row, all four counts = 0. Builds a full fixture
-- (charge, payment, expense, ticket) under one throwaway property,
-- deletes the property, and confirms nothing was left orphaned.
begin;

create temporary table tmp_d05 (property_id uuid, charge_id uuid) on commit drop;

with ins as (
  insert into public.properties (owner_id, address, monthly_rent, status)
  values ('{{LANDLORD_A_ID}}', 'D-05 Fixture Property', 1000, 'occupied')
  returning id
)
insert into tmp_d05 (property_id)
select id from ins;

with ins as (
  insert into public.rent_charges (property_id, period, amount_due, due_date)
  select property_id, '2026-01-01', 1000, '2026-01-10' from tmp_d05
  returning id
)
update tmp_d05 set charge_id = ins.id from ins;

insert into public.payments (rent_charge_id, amount, method)
select charge_id, 500, 'manual' from tmp_d05;

insert into public.expenses (property_id, amount, category, incurred_on)
select property_id, 100, 'maintenance', current_date from tmp_d05;

insert into public.maintenance_tickets (property_id, created_by, title)
select property_id, '{{LANDLORD_A_ID}}', 'D-05 fixture ticket' from tmp_d05;

delete from public.properties where id = (select property_id from tmp_d05);

select
  (select count(*) from public.rent_charges rc where rc.id = (select charge_id from tmp_d05)) as orphaned_charges,
  (select count(*) from public.payments p where p.rent_charge_id = (select charge_id from tmp_d05)) as orphaned_payments,
  (select count(*) from public.expenses e where e.property_id = (select property_id from tmp_d05)) as orphaned_expenses,
  (select count(*) from public.maintenance_tickets mt where mt.property_id = (select property_id from tmp_d05)) as orphaned_tickets;

rollback;

-- ============ D-06: deleting a tenant's auth user cascades their ============
-- ============ profile, and sets the property's tenant_id to null   ============
-- Expected: orphaned_profile = 0, property_tenant_id_after_delete = null.
-- profiles.id references auth.users(id) ON DELETE CASCADE (the profile
-- goes away); properties.tenant_id references profiles(id) ON DELETE
-- SET NULL (the property itself survives, un-orphaned).
--
-- NOTE: same auth.users column caveat as D-01 — add any column this
-- errors on, with a placeholder value; the rollback discards it.
begin;

create temporary table tmp_d06 (property_id uuid, tenant_id uuid) on commit drop;

with ins as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'd06-cascade-test@example.com',
    'not-a-real-hash',
    '{"provider":"email","providers":["email"]}',
    '{"role":"tenant","full_name":"D-06 Cascade Test"}',
    now(), now()
  )
  returning id
)
insert into tmp_d06 (tenant_id)
select id from ins;

with ins as (
  insert into public.properties (owner_id, tenant_id, address, monthly_rent, status)
  select '{{LANDLORD_A_ID}}', tenant_id, 'D-06 Fixture Property', 1000, 'occupied'
  from tmp_d06
  returning id
)
update tmp_d06 set property_id = ins.id from ins;

delete from auth.users where id = (select tenant_id from tmp_d06);

select
  (select count(*) from public.profiles where id = (select tenant_id from tmp_d06)) as orphaned_profile,
  (select tenant_id from public.properties where id = (select property_id from tmp_d06)) as property_tenant_id_after_delete;

rollback;

-- ============ D-07: RLS is enabled on every table ============
-- Expected: 7 rows, rls_enabled = true for every one. Read-only —
-- no transaction/rollback needed.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'profiles', 'properties', 'rent_charges', 'payments',
    'expenses', 'maintenance_tickets', 'ticket_updates'
  )
order by relname;
