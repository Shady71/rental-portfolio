import type { TicketUpdate } from '@/lib/maintenance'

export function TicketUpdatesTimeline({
  updates,
  viewerId,
}: {
  updates: TicketUpdate[]
  viewerId: string
}) {
  if (updates.length === 0) {
    return <p className="text-xs text-muted ">No updates yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {updates.map((update) => (
        <li key={update.id} className="text-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-body ">
              {update.author_id === viewerId ? 'You' : 'Landlord'}
            </span>
            <span className="text-xs text-muted ">
              {new Date(update.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-muted ">{update.body}</p>
        </li>
      ))}
    </ul>
  )
}
