import { formatTicketStatus, type TicketStatus } from '@/lib/maintenance'

const STYLES: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {formatTicketStatus(status)}
    </span>
  )
}
