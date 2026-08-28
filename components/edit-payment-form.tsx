'use client'

import { useActionState } from 'react'
import { updatePayment, type PaymentFormState } from '@/app/dashboard/rent/actions'
import { todayISO } from '@/lib/rent'

const initialState: PaymentFormState = {}

export function EditPaymentForm({
  paymentId,
  propertyId,
  defaultAmount,
  defaultPaidAt,
}: {
  paymentId: string
  propertyId: string
  defaultAmount: number
  defaultPaidAt: string
}) {
  const action = updatePayment.bind(null, paymentId, propertyId)
  const [state, formAction, pending] = useActionState(action, initialState)
  const today = todayISO()

  return (
    <form action={formAction} className="mt-1 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-amount-${paymentId}`} className="text-xs font-medium text-body ">
          Amount
        </label>
        <input
          id={`edit-amount-${paymentId}`}
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={defaultAmount}
          required
          className="w-28 rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
        />
        {state.errors?.amount && <p className="text-xs text-danger-text">{state.errors.amount}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-paid_at-${paymentId}`} className="text-xs font-medium text-body ">
          Date
        </label>
        <input
          id={`edit-paid_at-${paymentId}`}
          name="paid_at"
          type="date"
          defaultValue={defaultPaidAt}
          max={today}
          required
          className="rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
        />
        {state.errors?.paid_at && <p className="text-xs text-danger-text">{state.errors.paid_at}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-surface-hover px-3 py-1.5 text-sm font-medium text-heading transition-colors hover:bg-edge-strong disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>

      {state.formError && (
        <p role="alert" className="w-full text-xs text-danger-text">
          {state.formError}
        </p>
      )}
    </form>
  )
}
