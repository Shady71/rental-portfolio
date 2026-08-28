import type { ChargeStatus } from '@/lib/rent'

const STYLES: Record<ChargeStatus, string> = {
  paid: 'bg-success-bg text-success-text',
  due: 'bg-warning-bg text-warning-text',
  overdue: 'bg-danger-bg text-danger-text',
}

const LABELS: Record<ChargeStatus, string> = {
  paid: 'Paid',
  due: 'Due',
  overdue: 'Overdue',
}

export function RentStatusBadge({ status }: { status: ChargeStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
