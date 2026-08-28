import Link from 'next/link'
import { deriveChargeStatus, formatPeriod, type RentChargeWithPayments } from '@/lib/rent'
import { RentStatusBadge } from '@/components/rent-status-badge'

export function TenantRentSection({
  currentCharge,
  history,
  page,
  totalPages,
}: {
  currentCharge: RentChargeWithPayments | null
  history: RentChargeWithPayments[]
  page: number
  totalPages: number
}) {
  if (!currentCharge && history.length === 0 && page === 1) {
    return (
      <p className="text-sm text-muted ">
        No rent charges yet. Check back after your landlord sets up this month&apos;s rent.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {currentCharge ? (
        <CurrentChargeCard charge={currentCharge} />
      ) : (
        <p className="text-sm text-muted ">No charge generated for this month yet.</p>
      )}

      {(history.length > 0 || totalPages > 1) && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-body ">History</h3>
          {history.length > 0 ? (
            <ul className="flex flex-col divide-y divide-edge ">
              {history.map((charge) => {
                const { status, totalPaid } = deriveChargeStatus(charge, charge.payments)
                return (
                  <li key={charge.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-heading ">
                        {formatPeriod(charge.period)}
                      </span>
                      <RentStatusBadge status={status} />
                    </div>
                    <span className="text-sm text-muted ">
                      ${totalPaid.toLocaleString()} / ${charge.amount_due.toLocaleString()}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted ">No charges on this page.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-between text-xs text-muted ">
              <p>
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/portal?rentPage=${page - 1}`}
                  aria-disabled={page <= 1}
                  className={`rounded-md border border-edge-strong px-2 py-1  ${
                    page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-surface-raised'
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/portal?rentPage=${page + 1}`}
                  aria-disabled={page >= totalPages}
                  className={`rounded-md border border-edge-strong px-2 py-1  ${
                    page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-surface-raised'
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CurrentChargeCard({ charge }: { charge: RentChargeWithPayments }) {
  const { status, totalPaid, remaining } = deriveChargeStatus(charge, charge.payments)

  return (
    <div className="rounded-md border border-edge p-4 ">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted ">{formatPeriod(charge.period)}</p>
        <RentStatusBadge status={status} />
      </div>
      <p className="mt-1 text-2xl font-semibold text-heading ">
        ${charge.amount_due.toLocaleString()}
      </p>
      <p className="text-sm text-muted ">
        ${totalPaid.toLocaleString()} paid · ${remaining.toLocaleString()} remaining
      </p>

      {status !== 'paid' && (
        <div className="mt-3">
          {/* Stripe payment wiring goes here later — intentionally disabled for now. */}
          <button
            type="button"
            disabled
            title="Online payment is coming soon"
            className="cursor-not-allowed rounded-md border border-edge-strong px-3 py-1.5 text-sm font-medium text-muted  "
          >
            Pay rent
          </button>
          <p className="mt-1 text-xs text-muted 0">Online payment coming soon.</p>
        </div>
      )}
    </div>
  )
}
