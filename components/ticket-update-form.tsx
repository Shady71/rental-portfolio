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
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {pending ? 'Posting…' : 'Add note'}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  )
}
