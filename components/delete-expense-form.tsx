'use client'

import { useActionState } from 'react'
import { deleteExpense } from '@/app/dashboard/properties/actions'

const initialState: { error?: string } = {}

export function DeleteExpenseForm({
  expenseId,
  propertyId,
}: {
  expenseId: string
  propertyId: string
}) {
  const action = deleteExpense.bind(null, expenseId, propertyId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <details className="shrink-0">
      <summary className="w-fit cursor-pointer text-xs font-medium text-red-700 underline dark:text-red-400">
        Delete
      </summary>
      <form action={formAction} className="mt-1 flex flex-col items-end gap-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-red-700 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-50"
        >
          {pending ? 'Deleting…' : 'Confirm delete'}
        </button>
        {state.error && (
          <p role="alert" className="text-xs text-red-700 dark:text-red-400">
            {state.error}
          </p>
        )}
      </form>
    </details>
  )
}
