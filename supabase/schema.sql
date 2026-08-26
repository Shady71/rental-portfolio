-- =============================================================
-- Rental Portfolio — Supabase schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Order matters: tables -> trigger -> indexes -> RLS -> policies
-- =============================================================

-- ---------- 1. PROFILES ----------
-- auth.users is managed by Supabase and can't be extended,
-- so app-level user data (role, name) lives here, keyed to the same id.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('landlord', 'tenant')),
  full_name text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever a user signs up.
-- Role comes from metadata passed at signUp (defaults to 'landlord').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'landlord'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. PROPERTIES ----------
-- Single-unit model: a property IS the rentable thing.
-- tenant_id = current tenant (null = vacant). Simple by design;
-- a tenancies table with start/end dates is the future upgrade.
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid references public.profiles(id) on delete set null,
  address text not null,
  purchase_price numeric(12,2),
  monthly_rent numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- ---------- 3. RENT CHARGES ----------
-- Rent as periodic charges: one row per property per month.
-- No status column on purpose: paid/overdue is DERIVED from
-- payments + due_date, so it can never go stale.
create table public.rent_charges (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  period date not null,            -- first day of the month covered
  amount_due numeric(10,2) not null,
  due_date date not null,
  created_at timestamptz not null default now(),
  unique (property_id, period)     -- DB-enforced: no double-charging a month
);

-- ---------- 4. PAYMENTS ----------
-- Money received against a charge. 'manual' = landlord recorded it;
-- 'stripe' = written server-side by the Stripe webhook (service role).
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  rent_charge_id uuid not null references public.rent_charges(id) on delete cascade,
  amount numeric(10,2) not null,
  paid_at timestamptz not null default now(),
  method text not null check (method in ('manual', 'stripe')),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

-- ---------- 5. EXPENSES ----------
-- Lean expense logging for cash flow. Not accounting.
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  amount numeric(10,2) not null,
  category text not null check (category in
    ('maintenance', 'tax', 'insurance', 'mortgage', 'utilities', 'other')),
  incurred_on date not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- 6. MAINTENANCE TICKETS ----------
-- Full lifecycle, not just open/closed. created_by = who filed it.
create table public.maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- INDEXES ----------
-- Every column we filter or join on. This is the scale story:
-- each user only ever touches their indexed slice of the data.
create index idx_properties_owner  on public.properties(owner_id);
create index idx_properties_tenant on public.properties(tenant_id);
create index idx_charges_property  on public.rent_charges(property_id);
create index idx_charges_period    on public.rent_charges(period);
create index idx_payments_charge   on public.payments(rent_charge_id);
create index idx_expenses_property on public.expenses(property_id);
create index idx_tickets_property  on public.maintenance_tickets(property_id);
create index idx_tickets_status    on public.maintenance_tickets(status);

-- ---------- ROW LEVEL SECURITY ----------
-- Enable RLS everywhere: default becomes "nobody can do anything",
-- and each policy below opens exactly one deliberate path.
alter table public.profiles            enable row level security;
alter table public.properties          enable row level security;
alter table public.rent_charges        enable row level security;
alter table public.payments            enable row level security;
alter table public.expenses            enable row level security;
alter table public.maintenance_tickets enable row level security;

-- ----- profiles -----
create policy "read own profile" on public.profiles
  for select using (id = auth.uid());

create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

-- Landlord may read the profiles of tenants renting their properties
create policy "landlord reads own tenants" on public.profiles
  for select using (
    exists (
      select 1 from public.properties p
      where p.owner_id = auth.uid() and p.tenant_id = profiles.id
    )
  );

-- Tenant may read their landlord's profile
create policy "tenant reads own landlord" on public.profiles
  for select using (
    exists (
      select 1 from public.properties p
      where p.tenant_id = auth.uid() and p.owner_id = profiles.id
    )
  );

-- ----- properties -----
create policy "landlord full access to own properties" on public.properties
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "tenant reads own property" on public.properties
  for select using (tenant_id = auth.uid());

-- ----- rent_charges -----
create policy "landlord manages charges on own properties" on public.rent_charges
  for all
  using (
    exists (select 1 from public.properties p
            where p.id = property_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.properties p
            where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "tenant reads charges on own property" on public.rent_charges
  for select using (
    exists (select 1 from public.properties p
            where p.id = property_id and p.tenant_id = auth.uid())
  );

-- ----- payments -----
-- NOTE: tenants can READ but never INSERT payments. If they could,
-- anyone could mark their own rent paid. Stripe payments are inserted
-- server-side by the webhook using the service-role key.
create policy "landlord manages payments on own properties" on public.payments
  for all
  using (
    exists (
      select 1 from public.rent_charges rc
      join public.properties p on p.id = rc.property_id
      where rc.id = rent_charge_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rent_charges rc
      join public.properties p on p.id = rc.property_id
      where rc.id = rent_charge_id and p.owner_id = auth.uid()
    )
  );

create policy "tenant reads payments on own property" on public.payments
  for select using (
    exists (
      select 1 from public.rent_charges rc
      join public.properties p on p.id = rc.property_id
      where rc.id = rent_charge_id and p.tenant_id = auth.uid()
    )
  );

-- ----- expenses (landlord-only: tenants never see your finances) -----
create policy "landlord manages expenses on own properties" on public.expenses
  for all
  using (
    exists (select 1 from public.properties p
            where p.id = property_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.properties p
            where p.id = property_id and p.owner_id = auth.uid())
  );

-- ----- maintenance_tickets -----
create policy "landlord manages tickets on own properties" on public.maintenance_tickets
  for all
  using (
    exists (select 1 from public.properties p
            where p.id = property_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.properties p
            where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "tenant reads tickets on own property" on public.maintenance_tickets
  for select using (
    exists (select 1 from public.properties p
            where p.id = property_id and p.tenant_id = auth.uid())
  );

create policy "tenant files tickets on own property" on public.maintenance_tickets
  for insert with check (
    created_by = auth.uid()
    and exists (select 1 from public.properties p
                where p.id = property_id and p.tenant_id = auth.uid())
  );