'use client'

import { useActionState } from 'react'
import { assignTenant, type AssignTenantState } from '@/app/dashboard/properties/actions'

const initialState: AssignTenantState = {}

export function AssignTenantForm({ propertyId }: { propertyId: string }) {
  const action = assignTenant.bind(null, propertyId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="tenant_email" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Tenant email
        </label>
        <input
          id="tenant_email"
          name="tenant_email"
          type="email"
          required
          className="w-56 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending ? 'Assigning…' : 'Assign'}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-xs text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.message && <p className="w-full text-xs text-zinc-600 dark:text-zinc-400">{state.message}</p>}
    </form>
  )
}
