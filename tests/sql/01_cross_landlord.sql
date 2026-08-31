-- =============================================================
-- A-01 .. A-03 — cross-landlord access is blocked
-- Run one section at a time (select its text, or run the whole file).
-- Placeholders (replace the {{...}} tokens, keep the quotes):
--   {{LANDLORD_B_ID}}          -- Landlord B's auth user id
--   {{LANDLORD_A_PROPERTY_ID}} -- a property owned by Landlord A
--   {{LANDLORD_B_PROPERTY_ID}} -- a property owned by Landlord B
-- See tests/sql/README.md for how to obtain these.
-- Every section is wrapped in begin/rollback: nothing here persists.
--
-- Each query below returns auth.uid() alongside the real assertion, and
-- pairs the isolation check with a positive control (Landlord B seeing/
-- updating/deleting their OWN property) in the same query. This closes
-- a false-pass gap: "0 rows" also happens if impersonation silently
-- failed (a bad claim, a typo'd id, the role switch not taking effect)
-- — in that case the positive control would read 0 too, revealing it.
-- =============================================================

-- ============ A-01: cross-landlord SELECT is blocked ============
-- Expected: impersonated_as = {{LANDLORD_B_ID}}, own_property_visible = 1,
-- other_landlords_property_visible = 0.
--   impersonated_as null, or own_property_visible = 0 -> impersonation
--     is broken; the 0 below would not be proof of isolation.
--   other_landlords_property_visible > 0 -> isolation is broken.
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{LANDLORD_B_ID}}","role":"authenticated"}';

select
  auth.uid() as impersonated_as,
  (select count(*) from public.properties where id = '{{LANDLORD_B_PROPERTY_ID}}') as own_property_visible,
  (select count(*) from public.properties where id = '{{LANDLORD_A_PROPERTY_ID}}') as other_landlords_property_visible;

rollback;

-- ============ A-02: cross-landlord UPDATE is blocked ============
-- Single UPDATE targeting BOTH properties at once; RETURNING shows
-- exactly which one(s) actually matched.
-- Expected: exactly 1 row, id = {{LANDLORD_B_PROPERTY_ID}}.
--   0 rows -> impersonation is broken, not proof of isolation.
--   2 rows -> isolation is broken (Landlord B updated Landlord A's row too).
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{LANDLORD_B_ID}}","role":"authenticated"}';

update public.properties
set monthly_rent = 9999
where id in ('{{LANDLORD_B_PROPERTY_ID}}', '{{LANDLORD_A_PROPERTY_ID}}')
returning id, auth.uid() as impersonated_as;

rollback;

-- ============ A-03: cross-landlord DELETE is blocked ============
-- Same single-statement-targeting-both-rows pattern as A-02.
-- Expected: exactly 1 row, id = {{LANDLORD_B_PROPERTY_ID}}.
--   0 rows -> impersonation is broken, not proof of isolation.
--   2 rows -> isolation is broken.
begin;

set local role authenticated;
set local request.jwt.claims to '{"sub":"{{LANDLORD_B_ID}}","role":"authenticated"}';

delete from public.properties
where id in ('{{LANDLORD_B_PROPERTY_ID}}', '{{LANDLORD_A_PROPERTY_ID}}')
returning id, auth.uid() as impersonated_as;

rollback;
