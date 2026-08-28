import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { deriveChargeStatus, formatPeriod, getCurrentPeriod, type ChargeStatus } from '@/lib/rent'
import { RentStatusBadge } from '@/components/rent-status-badge'
import { GenerateChargesButton } from '@/components/generate-charges-button'

type PropertyWithCurrentCharge = {
  id: string
  address: string
  monthly_rent: number
  rent_charges: {
    id: string
    amount_due: number
    due_date: string
    period: string
    payments: { amount: number }[]
  }[]
}

export default async function RentOverviewPage() {
  const supabase = await createClient()
  const period = getCurrentPeriod()

  const { data: properties, error } = await supabase
    .from('properties')
    .select(
      `
      id,
      address,
      monthly_rent,
      rent_charges (
        id,
        amount_due,
        due_date,
        period,
        payments ( amount )
      )
    `
    )
    .eq('rent_charges.period', period)
    .order('address', { ascending: true })
    .returns<PropertyWithCurrentCharge[]>()

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
        <p
          role="alert"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          Could not load rent overview: {error.message}
        </p>
      </main>
    )
  }

  const rows = (properties ?? []).map((property) => {
    const charge = property.rent_charges[0] ?? null
    if (!charge) {
      return { property, charge: null, status: null as ChargeStatus | null, totalPaid: 0, remaining: 0 }
    }
    const { status, totalPaid, remaining } = deriveChargeStatus(charge, charge.payments)
    return { property, charge, status: status as ChargeStatus | null, totalPaid, remaining }
  })

  const totalCollected = rows.reduce((sum, row) => sum + row.totalPaid, 0)
  const totalOutstanding = rows.reduce((sum, row) => sum + row.remaining, 0)
  const overdueCount = rows.filter((row) => row.status === 'overdue').length

  const summary = [
    { label: 'Collected this month', value: `$${totalCollected.toLocaleString()}` },
    { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString()}` },
    { label: 'Overdue properties', value: String(overdueCount) },
  ]

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-accent">
          Rent — {formatPeriod(period)}
        </h1>
        <GenerateChargesButton />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-edge p-4 "
          >
            <p className="text-sm text-muted ">{item.label}</p>
            <p className="text-xl font-semibold text-heading ">{item.value}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted ">
          You don&apos;t have any properties yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-edge ">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-raised text-muted  ">
              <tr>
                <th className="px-4 py-2 font-medium">Property</th>
                <th className="px-4 py-2 font-medium">Monthly rent</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ property, charge, status, remaining }) => (
                <tr key={property.id} className="border-t border-edge ">
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/properties/${property.id}`}
                      className="font-medium text-heading underline "
                    >
                      {property.address}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-body ">
                    ${property.monthly_rent.toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    {status ? (
                      <RentStatusBadge status={status} />
                    ) : (
                      <span className="text-xs text-muted">Not generated</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-body ">
                    {charge ? `$${remaining.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
