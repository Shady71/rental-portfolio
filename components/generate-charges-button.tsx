'use client'

import { useActionState } from 'react'
import { generateMonthlyCharges, type GenerateChargesState } from '@/app/dashboard/rent/actions'

const initialState: GenerateChargesState = {}

export function GenerateChargesButton() {
  const [state, formAction, pending] = useActionState(generateMonthlyCharges, initialState)

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-surface-hover px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-edge-strong disabled:opacity-50"
      >
        {pending ? 'Generating…' : "Generate this month's charges"}
      </button>
      {state.message && (
        <p className="text-sm text-muted ">{state.message}</p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-danger-text">
          {state.error}
        </p>
      )}
    </form>
  )
}
