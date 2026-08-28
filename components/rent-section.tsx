import Link from 'next/link'
import { deriveChargeStatus, formatPeriod, type RentChargeWithPayments } from '@/lib/rent'
import { RentStatusBadge } from '@/components/rent-status-badge'
import { PaymentForm } from '@/components/payment-form'
import { EditPaymentForm } from '@/components/edit-payment-form'
import { DeletePaymentForm } from '@/components/delete-payment-form'

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
      <p className="text-sm text-muted ">
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
      <ul className="flex flex-col divide-y divide-edge ">
        {charges.map((charge) => {
          const { status, totalPaid, remaining } = deriveChargeStatus(charge, charge.payments)
          return (
            <li key={charge.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-heading ">
                    {formatPeriod(charge.period)}
                  </span>
                  <RentStatusBadge status={status} />
                </div>
                <span className="text-sm text-muted ">
                  ${charge.amount_due.toLocaleString()} due · ${totalPaid.toLocaleString()} paid
                </span>
              </div>

              {charge.payments.length > 0 && (
                <ul className="flex flex-col gap-2 text-xs text-muted ">
                  {charge.payments.map((payment) => (
                    <li key={payment.id} className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          ${payment.amount.toLocaleString()} on {new Date(payment.paid_at).toLocaleDateString()}
                        </span>
                        <div className="flex gap-3">
                          <details>
                            <summary className="w-fit cursor-pointer font-medium text-muted underline ">
                              Edit
                            </summary>
                            <EditPaymentForm
                              paymentId={payment.id}
                              propertyId={propertyId}
                              defaultAmount={payment.amount}
                              defaultPaidAt={payment.paid_at.slice(0, 10)}
                            />
                          </details>
                          <details>
                            <summary className="w-fit cursor-pointer font-medium text-danger-text underline ">
                              Delete
                            </summary>
                            <DeletePaymentForm paymentId={payment.id} propertyId={propertyId} />
                          </details>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {status !== 'paid' && (
                <details>
                  <summary className="w-fit cursor-pointer text-sm font-medium text-body underline ">
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
        <div className="flex items-center justify-between text-xs text-muted ">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/properties/${propertyId}?rentPage=${page - 1}`}
              aria-disabled={page <= 1}
              className={`rounded-md border border-edge-strong px-2 py-1  ${
                page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-surface-raised'
              }`}
            >
              Previous
            </Link>
            <Link
              href={`/dashboard/properties/${propertyId}?rentPage=${page + 1}`}
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
  )
}
