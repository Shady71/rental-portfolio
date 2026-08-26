import type { ChargeStatus } from '@/lib/rent'

const STYLES: Record<ChargeStatus, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  due: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
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
