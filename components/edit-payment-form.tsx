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
        <label htmlFor={`edit-amount-${paymentId}`} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
          className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state.errors?.amount && <p className="text-xs text-red-700 dark:text-red-400">{state.errors.amount}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-paid_at-${paymentId}`} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Date
        </label>
        <input
          id={`edit-paid_at-${paymentId}`}
          name="paid_at"
          type="date"
          defaultValue={defaultPaidAt}
          max={today}
          required
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state.errors?.paid_at && <p className="text-xs text-red-700 dark:text-red-400">{state.errors.paid_at}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>

      {state.formError && (
        <p role="alert" className="w-full text-xs text-red-700 dark:text-red-400">
          {state.formError}
        </p>
      )}
    </form>
  )
}
