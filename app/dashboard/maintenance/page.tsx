import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { flattenOpenTickets, type PropertyWithTickets } from '@/lib/maintenance'
import { TicketStatusBadge } from '@/components/ticket-status-badge'

export default async function MaintenanceOverviewPage() {
  const supabase = await createClient()

  const { data: properties, error } = await supabase
    .from('properties')
    .select(
      `
      id,
      address,
      maintenance_tickets (
        id,
        title,
        status,
        created_at
      )
    `
    )
    .in('maintenance_tickets.status', ['open', 'in_progress'])
    .returns<PropertyWithTickets[]>()

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
        <p
          role="alert"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          Could not load maintenance requests: {error.message}
        </p>
      </main>
    )
  }

  const rows = flattenOpenTickets(properties ?? [])

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-accent">Maintenance</h1>

      {rows.length === 0 ? (
        <p className="text-muted ">Nothing open right now.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-edge ">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-raised text-muted  ">
              <tr>
                <th className="px-4 py-2 font-medium">Property</th>
                <th className="px-4 py-2 font-medium">Request</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Filed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.ticketId} className="border-t border-edge ">
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/properties/${row.propertyId}`}
                      className="font-medium text-heading underline "
                    >
                      {row.propertyAddress}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-body ">{row.title}</td>
                  <td className="px-4 py-2">
                    <TicketStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-2 text-body ">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
