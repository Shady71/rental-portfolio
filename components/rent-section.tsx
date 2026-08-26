import { deriveChargeStatus, formatPeriod, type RentChargeWithPayments } from '@/lib/rent'
import { RentStatusBadge } from '@/components/rent-status-badge'
import { PaymentForm } from '@/components/payment-form'

export function RentSection({
  propertyId,
  charges,
}: {
  propertyId: string
  charges: RentChargeWithPayments[]
}) {
  if (charges.length === 0) {
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
  )
}
