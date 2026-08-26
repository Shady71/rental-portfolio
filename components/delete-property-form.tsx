'use client'

import { useActionState } from 'react'
import { deleteProperty, type DeleteState } from '@/app/dashboard/properties/actions'

const initialState: DeleteState = {}

export function DeletePropertyForm({ propertyId }: { propertyId: string }) {
  const deletePropertyWithId = deleteProperty.bind(null, propertyId)
  const [state, formAction, pending] = useActionState(deletePropertyWithId, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-50"
      >
        {pending ? 'Deleting…' : 'Yes, delete this property'}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  )
}
