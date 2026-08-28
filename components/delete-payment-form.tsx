'use client'

import { useActionState } from 'react'
import { deletePayment } from '@/app/dashboard/rent/actions'

const initialState: { error?: string } = {}

export function DeletePaymentForm({ paymentId, propertyId }: { paymentId: string; propertyId: string }) {
  const action = deletePayment.bind(null, paymentId, propertyId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="mt-1 flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-red-700 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-50"
      >
        {pending ? 'Deleting…' : 'Confirm delete'}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-danger-text">
          {state.error}
        </p>
      )}
    </form>
  )
}
