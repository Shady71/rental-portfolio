import { formatPropertyStatus, type PropertyStatus } from '@/lib/properties'

const STYLES: Record<PropertyStatus, string> = {
  occupied: 'bg-success-bg text-success-text',
  vacant: 'bg-surface-hover text-muted',
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {formatPropertyStatus(status)}
    </span>
  )
}
