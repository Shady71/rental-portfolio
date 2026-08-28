'use client'

import { useActionState } from 'react'
import { fileTicket, type TicketFormState } from '@/app/portal/actions'

const initialState: TicketFormState = {}

export function TicketForm({ propertyId }: { propertyId: string }) {
  const action = fileTicket.bind(null, propertyId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-xs font-medium text-body ">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
        />
        {state.errors?.title && <p className="text-xs text-danger-text">{state.errors.title}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-xs font-medium text-body ">
          Description <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-surface-hover px-3 py-1.5 text-sm font-medium text-heading transition-colors hover:bg-edge-strong disabled:opacity-50"
      >
        {pending ? 'Filing…' : 'File request'}
      </button>

      {state.formError && (
        <p role="alert" className="text-xs text-danger-text">
          {state.formError}
        </p>
      )}
    </form>
  )
}
