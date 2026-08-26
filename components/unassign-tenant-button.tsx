'use client'

import { useActionState } from 'react'
import { unassignTenant, type AssignTenantState } from '@/app/dashboard/properties/actions'

const initialState: AssignTenantState = {}

export function UnassignTenantButton({ propertyId }: { propertyId: string }) {
  const action = unassignTenant.bind(null, propertyId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {pending ? 'Removing…' : 'Unassign'}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  )
}
