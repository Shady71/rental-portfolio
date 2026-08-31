export const TICKET_STATUSES = ['open', 'in_progress', 'resolved'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export type MaintenanceTicket = {
  id: string
  title: string
  description: string | null
  status: TicketStatus
  created_at: string
  updated_at: string
}

export type TicketUpdate = {
  id: string
  body: string
  created_at: string
  author_id: string
}

const NEXT_STATUS: Record<TicketStatus, TicketStatus | null> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: null,
}

/** The next status in open -> in_progress -> resolved, or null once resolved. Pure. */
export function getNextStatus(status: TicketStatus): TicketStatus | null {
  return NEXT_STATUS[status]
}

export function validateTicketTitle(title: string): string | null {
  return title.trim() ? null : 'Title is required.'
}

export function formatTicketStatus(status: TicketStatus): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export type OpenTicketRow = {
  ticketId: string
  title: string
  status: TicketStatus
  createdAt: string
  propertyId: string
  propertyAddress: string
}

export type PropertyWithTickets = {
  id: string
  address: string
  maintenance_tickets: { id: string; title: string; status: TicketStatus; created_at: string }[]
}

const STATUS_RANK: Record<TicketStatus, number> = { open: 0, in_progress: 1, resolved: 2 }

/** Flattens properties + embedded tickets into rows sorted open-first, oldest-first. Pure. */
export function flattenOpenTickets(properties: PropertyWithTickets[]): OpenTicketRow[] {
  const rows = properties.flatMap((property) =>
    property.maintenance_tickets.map((ticket) => ({
      ticketId: ticket.id,
      title: ticket.title,
      status: ticket.status,
      createdAt: ticket.created_at,
      propertyId: property.id,
      propertyAddress: property.address,
    }))
  )

  return rows.sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status]
    return rankDiff !== 0 ? rankDiff : a.createdAt.localeCompare(b.createdAt)
  })
}
