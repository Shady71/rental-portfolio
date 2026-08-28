import { getNextStatus, type MaintenanceTicket, type TicketUpdate } from '@/lib/maintenance'
import { TicketStatusBadge } from '@/components/ticket-status-badge'
import { AdvanceTicketButton } from '@/components/advance-ticket-button'
import { TicketUpdatesTimeline } from '@/components/ticket-updates-timeline'
import { TicketUpdateForm } from '@/components/ticket-update-form'

export type LandlordTicket = MaintenanceTicket & {
  filedBy: string | null
  updates: TicketUpdate[]
}

export function MaintenanceSection({
  propertyId,
  viewerId,
  tickets,
}: {
  propertyId: string
  viewerId: string
  tickets: LandlordTicket[]
}) {
  if (tickets.length === 0) {
    return <p className="text-sm text-muted ">No maintenance requests yet.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-edge ">
      {tickets.map((ticket) => {
        const nextStatus = getNextStatus(ticket.status)
        return (
          <li key={ticket.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-medium text-heading ">{ticket.title}</span>
                <TicketStatusBadge status={ticket.status} />
              </div>
              {nextStatus && (
                <AdvanceTicketButton ticketId={ticket.id} propertyId={propertyId} nextStatus={nextStatus} />
              )}
            </div>
            {ticket.description && (
              <p className="text-sm text-muted ">{ticket.description}</p>
            )}
            <p className="text-xs text-muted ">
              Filed by {ticket.filedBy ?? 'tenant'} on {new Date(ticket.created_at).toLocaleDateString()}
              {ticket.updated_at !== ticket.created_at &&
                ` · updated ${new Date(ticket.updated_at).toLocaleDateString()}`}
            </p>

            <div className="flex flex-col gap-2 rounded-md bg-surface-raised p-3 ">
              <TicketUpdatesTimeline updates={ticket.updates} viewerId={viewerId} />
              <TicketUpdateForm ticketId={ticket.id} propertyId={propertyId} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
