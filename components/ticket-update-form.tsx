'use client'

import { useActionState } from 'react'
import { addTicketUpdate, type TicketUpdateState } from '@/app/dashboard/properties/actions'

const initialState: TicketUpdateState = {}

export function TicketUpdateForm({ ticketId, propertyId }: { ticketId: string; propertyId: string }) {
  const action = addTicketUpdate.bind(null, ticketId, propertyId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <textarea
        name="body"
        rows={2}
        placeholder="Add a progress note…"
        required
        className="rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
      />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md border border-edge-strong px-2 py-1 text-xs font-medium text-body transition-colors hover:bg-surface-raised hover:text-heading disabled:opacity-50"
      >
        {pending ? 'Posting…' : 'Add note'}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-danger-text">
          {state.error}
        </p>
      )}
    </form>
  )
}
