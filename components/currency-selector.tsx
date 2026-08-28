'use client'

import { useActionState } from 'react'
import { updateCurrency, type CurrencyFormState } from '@/app/dashboard/actions'
import { CURRENCY_CODES, type CurrencyCode } from '@/lib/currency'

const initialState: CurrencyFormState = {}

export function CurrencySelector({ currentCurrency }: { currentCurrency: CurrencyCode }) {
  const [state, formAction, pending] = useActionState(updateCurrency, initialState)

  return (
    <form action={formAction} className="flex items-center gap-2">
      <select
        name="currency"
        defaultValue={currentCurrency}
        className="rounded-md border border-edge-strong bg-surface-raised px-2 py-1 text-xs text-heading focus:border-accent focus:outline-none"
      >
        {CURRENCY_CODES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-edge-strong px-2 py-1 text-xs font-medium text-body transition-colors hover:bg-surface-raised hover:text-heading disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
      {state.error && <p className="text-xs text-danger-text">{state.error}</p>}
    </form>
  )
}
