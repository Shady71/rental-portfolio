'use client'

import { useActionState } from 'react'
import { advanceTicketStatus, type TicketActionState } from '@/app/dashboard/properties/actions'
import { formatTicketStatus, type TicketStatus } from '@/lib/maintenance'

const initialState: TicketActionState = {}

export function AdvanceTicketButton({
  ticketId,
  propertyId,
  nextStatus,
}: {
  ticketId: string
  propertyId: string
  nextStatus: TicketStatus
}) {
  const action = advanceTicketStatus.bind(null, ticketId, propertyId, nextStatus)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-edge-strong px-2 py-1 text-xs font-medium text-body transition-colors hover:bg-surface-raised hover:text-heading disabled:opacity-50"
      >
        {pending ? 'Updating…' : `Mark as ${formatTicketStatus(nextStatus)}`}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-danger-text">
          {state.error}
        </p>
      )}
    </form>
  )
}
