-- =============================================================
-- A-11, A-12 — anonymous access, and the tenant-lookup RPC
-- Run one section at a time (select its text, or run the whole file).
-- Placeholders (replace the {{...}} tokens, keep the quotes):
--   {{LANDLORD_A_ID}}          -- Landlord A's auth user id
--   {{LANDLORD_A_PROPERTY_ID}} -- any property owned by Landlord A
--   {{TENANT_A_ID}}            -- Tenant A's auth user id
-- See tests/sql/README.md for how to obtain these.
-- Every section is wrapped in begin/rollback: nothing here persists.
-- =============================================================

-- ============ A-11 (sanity check): a real user CAN see this property ============
-- Run this first, on its own. Confirms the property genuinely exists
-- and is visible under RLS to someone legitimate — otherwise the
-- anonymous test's "0 rows" could just mean RLS is broadly broken for
-- everyone, not that anonymous access specifically is blocked.
-- Expected: impersonated_as = {{LANDLORD_A_ID}}, property_visible = 1.
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{LANDLORD_A_ID}}","role":"authenticated"}';

select
  auth.uid() as impersonated_as,
  (select count(*) from public.properties where id = '{{LANDLORD_A_PROPERTY_ID}}') as property_visible;

rollback;

-- ============ A-11: anonymous reads are blocked ============
-- Only meaningful once the sanity check above confirms the property is
-- visible to a real user.
-- Expected: 0 rows. No policy has a `to` clause restricting it away
-- from PUBLIC, but every policy's USING clause compares against
-- auth.uid() — which is null with no "sub" claim — so nothing matches.
begin;

set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select * from public.properties where id = '{{LANDLORD_A_PROPERTY_ID}}';

rollback;

-- ============ A-12 (sanity check): a landlord CAN call ============
-- ============ find_tenant_by_email                      ============
-- Run this first, on its own. Confirms the function is callable at all
-- — looking up a nonexistent email returns null, not an exception —
-- before testing that a tenant is specifically rejected.
-- Expected: impersonated_as = {{LANDLORD_A_ID}}, lookup_result = null
-- (no error).
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{LANDLORD_A_ID}}","role":"authenticated"}';

select auth.uid() as impersonated_as, public.find_tenant_by_email('no-such-tenant@example.com') as lookup_result;

rollback;

-- ============ A-12: tenant cannot call find_tenant_by_email ============
-- Only meaningful once the sanity check above confirms the function
-- itself works for a legitimate caller.
-- Expected: ERROR P0001 — "only landlords may look up tenants". The
-- function checks the caller's own profiles.role and raises if it's
-- not 'landlord' (see supabase/schema.sql:337-339).
-- FALSE PASS WARNING: this exact message is a custom RAISE inside the
-- function, so it can't be confused with an unrelated object name the
-- way a generic 42501 could — but a *different* error (e.g. a plain
-- permission-denied instead of this message) means something else
-- failed first, not the intended role check. Compare the message text
-- exactly, not just the fact that something errored.
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{TENANT_A_ID}}","role":"authenticated"}';

select public.find_tenant_by_email('someone@example.com');

rollback;
