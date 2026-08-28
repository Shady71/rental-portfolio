import { formatTicketStatus, type TicketStatus } from '@/lib/maintenance'

const STYLES: Record<TicketStatus, string> = {
  open: 'bg-warning-bg text-warning-text',
  in_progress: 'bg-info-bg text-info-text',
  resolved: 'bg-success-bg text-success-text',
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {formatTicketStatus(status)}
    </span>
  )
}
