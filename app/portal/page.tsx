import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import { TicketForm } from '@/components/ticket-form'
import { TicketStatusBadge } from '@/components/ticket-status-badge'
import { TicketUpdatesTimeline } from '@/components/ticket-updates-timeline'
import type { MaintenanceTicket, TicketUpdate } from '@/lib/maintenance'
import { TenantRentSection } from '@/components/tenant-rent-section'
import type { RentChargeWithPayments } from '@/lib/rent'

type TenantTicket = MaintenanceTicket & { updates: TicketUpdate[] }

export default async function PortalPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data) {
    redirect('/login')
  }

  // A tenant is expected to have exactly one assigned property. The schema
  // doesn't enforce that with a unique constraint, so this defensively
  // takes the earliest assignment rather than erroring if more than one
  // were ever set.
  const { data: property } = await supabase
    .from('properties')
    .select('id, address')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { data: charges, error: chargesError } = property
    ? await supabase
        .from('rent_charges')
        .select('id, period, amount_due, due_date, payments ( id, amount, paid_at )')
        .eq('property_id', property.id)
        .order('period', { ascending: false })
        .limit(12)
        .returns<RentChargeWithPayments[]>()
    : { data: null, error: null }

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
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Tenant portal</h1>
        <LogoutButton />
      </div>

      {!property ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          No property assigned yet. Contact your landlord to get set up.
        </p>
      ) : (
        <>
          <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Your property</p>
            <p className="text-lg font-medium text-zinc-950 dark:text-zinc-50">{property.address}</p>
          </div>

          <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 font-medium text-zinc-700 dark:text-zinc-300">Rent</h2>
            {chargesError ? (
              <p
                role="alert"
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
              >
                Could not load rent info: {chargesError.message}
              </p>
            ) : (
              <TenantRentSection charges={charges ?? []} />
            )}
          </div>

          <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 font-medium text-zinc-700 dark:text-zinc-300">Maintenance</h2>

            {ticketsWithUpdates.length > 0 ? (
              <ul className="mb-4 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                {ticketsWithUpdates.map((ticket) => (
                  <li key={ticket.id} className="flex flex-col gap-2 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{ticket.title}</span>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{ticket.description}</p>
                    )}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Filed {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                    <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
                      <TicketUpdatesTimeline updates={ticket.updates} viewerId={data.claims.sub} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">No maintenance requests yet.</p>
            )}

            <details>
              <summary className="w-fit cursor-pointer text-sm font-medium text-zinc-700 underline dark:text-zinc-300">
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
