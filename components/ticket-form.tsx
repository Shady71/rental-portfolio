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
        <label htmlFor="title" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state.errors?.title && <p className="text-xs text-red-700 dark:text-red-400">{state.errors.title}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Description <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending ? 'Filing…' : 'File request'}
      </button>

      {state.formError && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400">
          {state.formError}
        </p>
      )}
    </form>
  )
}
