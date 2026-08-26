import { deriveChargeStatus, formatPeriod, getCurrentPeriod, type RentChargeWithPayments } from '@/lib/rent'
import { RentStatusBadge } from '@/components/rent-status-badge'

export function TenantRentSection({ charges }: { charges: RentChargeWithPayments[] }) {
  if (charges.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No rent charges yet. Check back after your landlord sets up this month&apos;s rent.
      </p>
    )
  }

  const currentPeriod = getCurrentPeriod()
  const currentCharge = charges.find((charge) => charge.period === currentPeriod) ?? null
  const history = currentCharge ? charges.filter((charge) => charge.id !== currentCharge.id) : charges

  return (
    <div className="flex flex-col gap-4">
      {currentCharge ? (
        <CurrentChargeCard charge={currentCharge} />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No charge generated for this month yet.</p>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">History</h3>
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {history.map((charge) => {
              const { status, totalPaid } = deriveChargeStatus(charge, charge.payments)
              return (
                <li key={charge.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {formatPeriod(charge.period)}
                    </span>
                    <RentStatusBadge status={status} />
                  </div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    ${totalPaid.toLocaleString()} / ${charge.amount_due.toLocaleString()}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function CurrentChargeCard({ charge }: { charge: RentChargeWithPayments }) {
  const { status, totalPaid, remaining } = deriveChargeStatus(charge, charge.payments)

  return (
    <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatPeriod(charge.period)}</p>
        <RentStatusBadge status={status} />
      </div>
      <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        ${charge.amount_due.toLocaleString()}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        ${totalPaid.toLocaleString()} paid · ${remaining.toLocaleString()} remaining
      </p>

      {status !== 'paid' && (
        <div className="mt-3">
          {/* Stripe payment wiring goes here later — intentionally disabled for now. */}
          <button
            type="button"
            disabled
            title="Online payment is coming soon"
            className="cursor-not-allowed rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-400 dark:border-zinc-700 dark:text-zinc-600"
          >
            Pay rent
          </button>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Online payment coming soon.</p>
        </div>
      )}
    </div>
  )
}
