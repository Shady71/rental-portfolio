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
        className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending ? 'Generating…' : "Generate this month's charges"}
      </button>
      {state.message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{state.message}</p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  )
}
