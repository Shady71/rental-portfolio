import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import { TicketForm } from '@/components/ticket-form'
import { TicketStatusBadge } from '@/components/ticket-status-badge'
import { TicketUpdatesTimeline } from '@/components/ticket-updates-timeline'
import type { MaintenanceTicket, TicketUpdate } from '@/lib/maintenance'
import { TenantRentSection } from '@/components/tenant-rent-section'
import { getCurrentPeriod, RENT_HISTORY_PAGE_SIZE, type RentChargeWithPayments } from '@/lib/rent'
import { RoleBadge } from '@/components/role-badge'
import type { CurrencyCode } from '@/lib/currency'

type TenantTicket = MaintenanceTicket & { updates: TicketUpdate[] }

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ rentPage?: string }>
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data) {
    redirect('/login')
  }

  const { rentPage: rentPageParam } = await searchParams
  const rentPage = Math.max(1, Number(rentPageParam) || 1)
  const rentFrom = (rentPage - 1) * RENT_HISTORY_PAGE_SIZE
  const rentTo = rentFrom + RENT_HISTORY_PAGE_SIZE - 1

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', data.claims.sub)
    .maybeSingle()

  if (profile?.role === 'landlord') {
    redirect('/dashboard')
  }

  const displayName = profile?.full_name?.trim() || data.claims.email || 'there'

  // A tenant is expected to have exactly one assigned property. The schema
  // doesn't enforce that with a unique constraint, so this defensively
  // takes the earliest assignment rather than erroring if more than one
  // were ever set.
  const { data: property } = await supabase
    .from('properties')
    .select('id, address, owner_id')
    .eq('tenant_id', data.claims.sub)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  let landlordCurrency: CurrencyCode = 'USD'
  if (property) {
    const { data: landlordProfile } = await supabase
      .from('profiles')
      .select('currency')
      .eq('id', property.owner_id)
      .maybeSingle()
    if (landlordProfile?.currency) {
      landlordCurrency = landlordProfile.currency as CurrencyCode
    }
  }

  const currentPeriod = getCurrentPeriod()

  const { data: currentCharge, error: currentChargeError } = property
    ? await supabase
        .from('rent_charges')
        .select('id, period, amount_due, due_date, payments ( id, amount, paid_at )')
        .eq('property_id', property.id)
        .eq('period', currentPeriod)
        .maybeSingle()
    : { data: null, error: null }

  const { data: rentHistory, count: rentHistoryCount, error: rentHistoryError } = property
    ? await supabase
        .from('rent_charges')
        .select('id, period, amount_due, due_date, payments ( id, amount, paid_at )', { count: 'exact' })
        .eq('property_id', property.id)
        .neq('period', currentPeriod)
        .order('period', { ascending: false })
        .range(rentFrom, rentTo)
        .returns<RentChargeWithPayments[]>()
    : { data: null, count: null, error: null }

  const rentTotalPages = Math.max(1, Math.ceil((rentHistoryCount ?? 0) / RENT_HISTORY_PAGE_SIZE))
  const chargesError = currentChargeError || rentHistoryError

  const { data: tickets } = property
    ? await supabase
        .from('maintenance_tickets')
        .select(
          'id, title, description, status, created_at, updated_at, ticket_updates ( id, body, created_at, author_id )'
        )
        .eq('property_id', property.id)
        .order('created_at', { ascending: false })
        .order('created_at', { ascending: true, referencedTable: 'ticket_updates' })
        .returns<(MaintenanceTicket & { ticket_updates: TicketUpdate[] })[]>()
    : { data: null }

  const ticketsWithUpdates: TenantTicket[] = (tickets ?? []).map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    updates: ticket.ticket_updates,
  }))

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-accent">Welcome, {displayName}</h1>
          <div className="mt-1">
            <RoleBadge role={profile?.role ?? 'tenant'} />
          </div>
        </div>
        <LogoutButton />
      </div>

      {!property ? (
        <p className="text-muted ">
          No property assigned yet. Contact your landlord to get set up.
        </p>
      ) : (
        <>
          <div className="rounded-md border border-edge p-4 ">
            <p className="text-sm text-muted ">Your property</p>
            <p className="text-lg font-medium text-heading ">{property.address}</p>
          </div>

          <div className="rounded-md border border-edge p-4 ">
            <h2 className="mb-3 font-medium text-body ">Rent</h2>
            {chargesError ? (
              <p
                role="alert"
                className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
              >
                Could not load rent info: {chargesError.message}
              </p>
            ) : (
              <TenantRentSection
                currentCharge={currentCharge}
                history={rentHistory ?? []}
                page={rentPage}
                totalPages={rentTotalPages}
                currency={landlordCurrency}
              />
            )}
          </div>

          <div className="rounded-md border border-edge p-4 ">
            <h2 className="mb-3 font-medium text-body ">Maintenance</h2>

            {ticketsWithUpdates.length > 0 ? (
              <ul className="mb-4 flex flex-col divide-y divide-edge ">
                {ticketsWithUpdates.map((ticket) => (
                  <li key={ticket.id} className="flex flex-col gap-2 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-heading ">{ticket.title}</span>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-muted ">{ticket.description}</p>
                    )}
                    <p className="text-xs text-muted ">
                      Filed {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                    <div className="rounded-md bg-surface-raised p-3 ">
                      <TicketUpdatesTimeline updates={ticket.updates} viewerId={data.claims.sub} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-muted ">No maintenance requests yet.</p>
            )}

            <details>
              <summary className="w-fit cursor-pointer text-sm font-medium text-body underline ">
                File a maintenance request
              </summary>
              <TicketForm propertyId={property.id} />
            </details>
          </div>
        </>
      )}
    </main>
  )
}
