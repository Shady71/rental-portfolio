'use client'

import { useActionState } from 'react'
import type { ExpenseFormState } from '@/app/dashboard/properties/actions'
import { EXPENSE_CATEGORIES, formatExpenseCategory, todayISO } from '@/lib/expenses'

const initialState: ExpenseFormState = {}

export function ExpenseForm({
  action,
}: {
  action: (prevState: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>
}) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const today = todayISO()

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="amount" className="text-xs font-medium text-body ">
          Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-28 rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
        />
        {state.errors?.amount && (
          <p className="text-xs text-danger-text">{state.errors.amount}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-xs font-medium text-body ">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue=""
          className="rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
        >
          <option value="" disabled>
            Select
          </option>
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {formatExpenseCategory(category)}
            </option>
          ))}
        </select>
        {state.errors?.category && (
          <p className="text-xs text-danger-text">{state.errors.category}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="incurred_on" className="text-xs font-medium text-body ">
          Date
        </label>
        <input
          id="incurred_on"
          name="incurred_on"
          type="date"
          defaultValue={today}
          required
          className="rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
        />
        {state.errors?.incurred_on && (
          <p className="text-xs text-danger-text">{state.errors.incurred_on}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="note" className="text-xs font-medium text-body ">
          Note <span className="text-muted">(optional)</span>
        </label>
        <input
          id="note"
          name="note"
          type="text"
          className="w-40 rounded-md border border-edge-strong bg-surface-raised px-2 py-1.5 text-sm text-heading focus:border-accent focus:outline-none   "
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-surface-hover px-3 py-1.5 text-sm font-medium text-heading transition-colors hover:bg-edge-strong disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add expense'}
      </button>

      {state.formError && (
        <p role="alert" className="w-full text-xs text-danger-text">
          {state.formError}
        </p>
      )}
    </form>
  )
}
