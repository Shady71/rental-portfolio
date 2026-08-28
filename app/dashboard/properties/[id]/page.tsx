import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { RentSection } from '@/components/rent-section'
import { RENT_HISTORY_PAGE_SIZE, type RentChargeWithPayments } from '@/lib/rent'
import { ExpensesSection } from '@/components/expenses-section'
import type { Expense } from '@/lib/expenses'
import { TenantSection } from '@/components/tenant-section'
import { MaintenanceSection, type LandlordTicket } from '@/components/maintenance-section'
import type { TicketStatus, TicketUpdate } from '@/lib/maintenance'
import { formatCurrency, type CurrencyCode } from '@/lib/currency'
import { PropertyStatusBadge } from '@/components/property-status-badge'

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ rentPage?: string }>
}) {
  const { id } = await params
  const { rentPage: rentPageParam } = await searchParams
  const rentPage = Math.max(1, Number(rentPageParam) || 1)
  const rentFrom = (rentPage - 1) * RENT_HISTORY_PAGE_SIZE
  const rentTo = rentFrom + RENT_HISTORY_PAGE_SIZE - 1
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getClaims()
  if (!authData) {
    redirect('/login')
  }

  const { data: ownProfile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', authData.claims.sub)
    .maybeSingle()
  const currency = (ownProfile?.currency as CurrencyCode) ?? 'USD'

  const { data: property, error } = await supabase
    .from('properties')
    .select('id, address, monthly_rent, purchase_price, created_at, tenant_id, status')
    .eq('id', id)
    .maybeSingle()

  if (error || !property) {
    notFound()
  }

  let tenantName: string | null = null
  if (property.tenant_id) {
    const { data: tenantProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', property.tenant_id)
      .maybeSingle()
    tenantName = tenantProfile?.full_name ?? null
  }

  const { data: charges, count: chargesCount, error: chargesError } = await supabase
    .from('rent_charges')
    .select('id, period, amount_due, due_date, payments ( id, amount, paid_at )', { count: 'exact' })
    .eq('property_id', property.id)
    .order('period', { ascending: false })
    .range(rentFrom, rentTo)
    .returns<RentChargeWithPayments[]>()

  if (chargesError) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <p
          role="alert"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          Could not load rent charges: {chargesError.message}
        </p>
      </main>
    )
  }

  const rentTotalPages = Math.max(1, Math.ceil((chargesCount ?? 0) / RENT_HISTORY_PAGE_SIZE))

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('id, amount, category, incurred_on, note')
    .eq('property_id', property.id)
    .order('incurred_on', { ascending: false })
    .limit(12)
    .returns<Expense[]>()

  if (expensesError) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <p
          role="alert"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          Could not load expenses: {expensesError.message}
        </p>
      </main>
    )
  }

  // Separate lightweight query for the true all-time total, since the
  // list above is capped at 12 and summing only the visible rows would
  // understate it once a property has more than that.
  const { data: expenseAmounts } = await supabase
    .from('expenses')
    .select('amount')
    .eq('property_id', property.id)

  const expenseTotal = (expenseAmounts ?? []).reduce((sum, row) => sum + row.amount, 0)

  const { data: ticketsRaw, error: ticketsError } = await supabase
    .from('maintenance_tickets')
    .select(
      'id, title, description, status, created_at, updated_at, profiles ( full_name ), ticket_updates ( id, body, created_at, author_id )'
    )
    .eq('property_id', property.id)
    .order('created_at', { ascending: false })
    .order('created_at', { ascending: true, referencedTable: 'ticket_updates' })
    .returns<
      {
        id: string
        title: string
        description: string | null
        status: TicketStatus
        created_at: string
        updated_at: string
        profiles: { full_name: string | null } | null
        ticket_updates: TicketUpdate[]
      }[]
    >()

  if (ticketsError) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <p
          role="alert"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          Could not load maintenance tickets: {ticketsError.message}
        </p>
      </main>
    )
  }

  const tickets: LandlordTicket[] = (ticketsRaw ?? []).map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    filedBy: ticket.profiles?.full_name ?? null,
    updates: ticket.ticket_updates,
  }))

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/properties"
            className="text-sm text-muted underline "
          >
            ← All properties
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-accent">
            {property.address}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/properties/${property.id}/edit`}
            className="rounded-md border border-edge-strong px-3 py-1.5 text-sm font-medium text-body transition-colors hover:bg-surface-raised hover:text-heading"
          >
            Edit
          </Link>
          <Link
            href={`/dashboard/properties/${property.id}/delete`}
            className="rounded-md border border-danger-text/40 px-3 py-1.5 text-sm font-medium text-danger-text transition-colors hover:bg-danger-bg"
          >
            Delete
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-md border border-edge p-4 ">
        <div>
          <dt className="text-sm text-muted ">Monthly rent</dt>
          <dd className="text-lg text-heading ">
            {formatCurrency(property.monthly_rent, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted ">Purchase price</dt>
          <dd className="text-lg text-heading ">
            {property.purchase_price ? formatCurrency(property.purchase_price, currency) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted ">Added on</dt>
          <dd className="text-lg text-heading ">
            {new Date(property.created_at).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted ">Status</dt>
          <dd className="mt-1">
            <PropertyStatusBadge status={property.status} />
          </dd>
        </div>
      </dl>

      <section className="flex flex-col gap-4">
        <div className="rounded-md border border-edge p-4 ">
          <h2 className="mb-3 font-medium text-body ">Tenant</h2>
          <TenantSection propertyId={property.id} isAssigned={property.tenant_id !== null} tenantName={tenantName} />
        </div>

        <div className="rounded-md border border-edge p-4 ">
          <h2 className="mb-3 font-medium text-body ">Rent</h2>
          <RentSection
            propertyId={property.id}
            charges={charges ?? []}
            page={rentPage}
            totalPages={rentTotalPages}
            currency={currency}
          />
        </div>

        <div className="rounded-md border border-edge p-4 ">
          <h2 className="mb-3 font-medium text-body ">Expenses</h2>
          <ExpensesSection
            propertyId={property.id}
            expenses={expenses ?? []}
            total={expenseTotal}
            currency={currency}
          />
        </div>

        <div className="rounded-md border border-edge p-4 ">
          <h2 className="mb-3 font-medium text-body ">Maintenance</h2>
          <MaintenanceSection propertyId={property.id} viewerId={authData.claims.sub} tickets={tickets} />
        </div>
      </section>
    </main>
  )
}
