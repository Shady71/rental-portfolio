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
        className="rounded-md border border-edge-strong px-2 py-1 text-xs font-medium text-body transition-colors hover:bg-surface-raised hover:text-heading disabled:opacity-50"
      >
        {pending ? 'Removing…' : 'Unassign'}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-danger-text">
          {state.error}
        </p>
      )}
    </form>
  )
}
