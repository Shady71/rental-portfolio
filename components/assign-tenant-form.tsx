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
        <label htmlFor="tenant_email" className="text-xs font-medium text-body ">
          Tenant email
        </label>
        <input
          id="tenant_email"
          name="tenant_email"
          type="email"
          required
          className="w-56 rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-surface-hover px-3 py-1.5 text-sm font-medium text-heading transition-colors hover:bg-edge-strong disabled:opacity-50"
      >
        {pending ? 'Assigning…' : 'Assign'}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-xs text-danger-text">
          {state.error}
        </p>
      )}
      {state.message && <p className="w-full text-xs text-muted ">{state.message}</p>}
    </form>
  )
}
