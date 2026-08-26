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
        <label htmlFor="amount" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state.errors?.amount && (
          <p className="text-xs text-red-700 dark:text-red-400">{state.errors.amount}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue=""
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
          <p className="text-xs text-red-700 dark:text-red-400">{state.errors.category}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="incurred_on" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Date
        </label>
        <input
          id="incurred_on"
          name="incurred_on"
          type="date"
          defaultValue={today}
          max={today}
          required
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state.errors?.incurred_on && (
          <p className="text-xs text-red-700 dark:text-red-400">{state.errors.incurred_on}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="note" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Note <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="note"
          name="note"
          type="text"
          className="w-40 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending ? 'Adding…' : 'Add expense'}
      </button>

      {state.formError && (
        <p role="alert" className="w-full text-xs text-red-700 dark:text-red-400">
          {state.formError}
        </p>
      )}
    </form>
  )
}
