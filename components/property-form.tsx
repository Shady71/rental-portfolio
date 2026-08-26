'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import type { PropertyFormState } from '@/app/dashboard/properties/actions'

const initialState: PropertyFormState = {}

type PropertyFormProps = {
  action: (prevState: PropertyFormState, formData: FormData) => Promise<PropertyFormState>
  defaultValues?: {
    address: string
    monthly_rent: number
    purchase_price: number | null
  }
  submitLabel: string
  pendingLabel: string
  cancelHref: string
}

export function PropertyForm({
  action,
  defaultValues,
  submitLabel,
  pendingLabel,
  cancelHref,
}: PropertyFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          required
          defaultValue={defaultValues?.address}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state.errors?.address && (
          <p className="text-sm text-red-700 dark:text-red-400">{state.errors.address}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="monthly_rent" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Monthly rent
        </label>
        <input
          id="monthly_rent"
          name="monthly_rent"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaultValues?.monthly_rent}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state.errors?.monthly_rent && (
          <p className="text-sm text-red-700 dark:text-red-400">{state.errors.monthly_rent}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="purchase_price" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Purchase price <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="purchase_price"
          name="purchase_price"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={defaultValues?.purchase_price ?? undefined}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state.errors?.purchase_price && (
          <p className="text-sm text-red-700 dark:text-red-400">{state.errors.purchase_price}</p>
        )}
      </div>

      {state.formError && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.formError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-zinc-600 underline dark:text-zinc-400">
          Cancel
        </Link>
      </div>
    </form>
  )
}
