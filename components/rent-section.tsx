import Link from 'next/link'
import { deriveChargeStatus, formatPeriod, type RentChargeWithPayments } from '@/lib/rent'
import { RentStatusBadge } from '@/components/rent-status-badge'
import { PaymentForm } from '@/components/payment-form'

export function RentSection({
  propertyId,
  charges,
  page,
  totalPages,
}: {
  propertyId: string
  charges: RentChargeWithPayments[]
  page: number
  totalPages: number
}) {
  if (charges.length === 0 && page === 1) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No rent charges yet. Generate this month&apos;s charges from the{' '}
        <a href="/dashboard/rent" className="underline">
          rent overview
        </a>
        .
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {charges.map((charge) => {
          const { status, totalPaid, remaining } = deriveChargeStatus(charge, charge.payments)
          return (
            <li key={charge.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-zinc-950 dark:text-zinc-50">
                    {formatPeriod(charge.period)}
                  </span>
                  <RentStatusBadge status={status} />
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  ${charge.amount_due.toLocaleString()} due · ${totalPaid.toLocaleString()} paid
                </span>
              </div>

              {charge.payments.length > 0 && (
                <ul className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {charge.payments.map((payment) => (
                    <li key={payment.id}>
                      ${payment.amount.toLocaleString()} on{' '}
                      {new Date(payment.paid_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}

              {status !== 'paid' && (
                <details>
                  <summary className="w-fit cursor-pointer text-sm font-medium text-zinc-700 underline dark:text-zinc-300">
                    Record payment
                  </summary>
                  <PaymentForm chargeId={charge.id} propertyId={propertyId} defaultAmount={remaining} />
                </details>
              )}
            </li>
          )
        })}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/properties/${propertyId}?rentPage=${page - 1}`}
              aria-disabled={page <= 1}
              className={`rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 ${
                page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              Previous
            </Link>
            <Link
              href={`/dashboard/properties/${propertyId}?rentPage=${page + 1}`}
              aria-disabled={page >= totalPages}
              className={`rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 ${
                page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
