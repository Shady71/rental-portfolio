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
        <label htmlFor="address" className="text-sm font-medium text-body ">
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          required
          defaultValue={defaultValues?.address}
          className="rounded-md border border-edge-strong bg-surface-raised px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none   "
        />
        {state.errors?.address && (
          <p className="text-sm text-danger-text">{state.errors.address}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="monthly_rent" className="text-sm font-medium text-body ">
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
          className="rounded-md border border-edge-strong bg-surface-raised px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none   "
        />
        {state.errors?.monthly_rent && (
          <p className="text-sm text-danger-text">{state.errors.monthly_rent}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="purchase_price" className="text-sm font-medium text-body ">
          Purchase price <span className="text-muted">(optional)</span>
        </label>
        <input
          id="purchase_price"
          name="purchase_price"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={defaultValues?.purchase_price ?? undefined}
          className="rounded-md border border-edge-strong bg-surface-raised px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none   "
        />
        {state.errors?.purchase_price && (
          <p className="text-sm text-danger-text">{state.errors.purchase_price}</p>
        )}
      </div>

      {state.formError && (
        <p
          role="alert"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          {state.formError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-surface-hover px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-edge-strong disabled:opacity-50"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-muted underline ">
          Cancel
        </Link>
      </div>
    </form>
  )
}
