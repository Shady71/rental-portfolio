import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { formatPeriod, getCurrentPeriod, getNextPeriod } from '@/lib/rent'
import { summarizePropertyMonth, summarizePortfolio, sortByAttention, type PropertyMonthInput } from '@/lib/portfolio'
import { formatCurrency, type CurrencyCode } from '@/lib/currency'
import { RentStatusBadge } from '@/components/rent-status-badge'
import { RoleBadge } from '@/components/role-badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const period = getCurrentPeriod()
  const periodEnd = getNextPeriod(period)

  const { data: authData } = await supabase.auth.getClaims()
  if (!authData) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, currency')
    .eq('id', authData.claims.sub)
    .maybeSingle()
  const displayName = profile?.full_name?.trim() || authData.claims.email || 'there'
  const currency = (profile?.currency as CurrencyCode) ?? 'USD'

  const { data: properties, error } = await supabase
    .from('properties')
    .select(
      `
      id,
      address,
      status,
      rent_charges (
        amount_due,
        due_date,
        payments ( amount )
      ),
      expenses (
        amount
      )
    `
    )
    .eq('owner_id', authData.claims.sub)
    .eq('rent_charges.period', period)
    .gte('expenses.incurred_on', period)
    .lt('expenses.incurred_on', periodEnd)
    .returns<PropertyMonthInput[]>()

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <p
          role="alert"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          Could not load the dashboard: {error.message}
        </p>
      </main>
    )
  }

  const rows = sortByAttention((properties ?? []).map((property) => summarizePropertyMonth(property)))
  const portfolio = summarizePortfolio(rows)
  const isPositive = portfolio.netCashFlow >= 0

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-accent">Welcome, {displayName}</h1>
        <div className="mt-1 flex items-center gap-2">
          <RoleBadge role={profile?.role ?? 'landlord'} />
          <p className="text-sm text-muted ">{formatPeriod(period)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-edge p-6">
        <p className="text-sm font-medium text-muted ">Net cash flow this month</p>
        <p
          className={`text-4xl font-bold ${
            isPositive ? 'text-success-text' : 'text-danger-text'
          }`}
        >
          {isPositive ? '+' : '-'}{formatCurrency(Math.abs(portfolio.netCashFlow), currency)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-md border border-edge p-4 ">
          <p className="text-sm text-muted ">Properties</p>
          <p className="text-xl font-semibold text-heading ">{portfolio.totalProperties}</p>
          <p className="text-xs text-muted ">
            {portfolio.occupiedCount} occupied · {portfolio.vacantCount} vacant
          </p>
        </div>
        <div className="rounded-md border border-edge p-4 ">
          <p className="text-sm text-muted ">Rent collected</p>
          <p className="text-xl font-semibold text-heading ">
            {formatCurrency(portfolio.rentCollected, currency)}
          </p>
        </div>
        <div className="rounded-md border border-edge p-4 ">
          <p className="text-sm text-muted ">Rent outstanding</p>
          <p className="text-xl font-semibold text-heading ">
            {formatCurrency(portfolio.rentOutstanding, currency)}
          </p>
        </div>
        <div className="rounded-md border border-edge p-4 ">
          <p className="text-sm text-muted ">Expenses</p>
          <p className="text-xl font-semibold text-heading ">
            {formatCurrency(portfolio.totalExpenses, currency)}
          </p>
        </div>
        <div className="rounded-md border border-edge p-4 ">
          <p className="text-sm text-muted ">Overdue</p>
          <p
            className={`text-xl font-semibold ${
              portfolio.overdueCount > 0 ? 'text-danger-text' : 'text-heading '
            }`}
          >
            {portfolio.overdueCount}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-edge-strong py-16 text-center ">
          <p className="text-muted ">You don&apos;t have any properties yet.</p>
          <Link
            href="/dashboard/properties/new"
            className="rounded-md bg-surface-hover px-4 py-2 text-sm font-medium text-heading transition-colors hover:bg-edge-strong"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-edge ">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-raised text-muted  ">
              <tr>
                <th className="px-4 py-2 font-medium">Property</th>
                <th className="px-4 py-2 font-medium">Rent status</th>
                <th className="px-4 py-2 font-medium">Collected / due</th>
                <th className="px-4 py-2 font-medium">Expenses</th>
                <th className="px-4 py-2 font-medium">Net cash flow</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-edge ">
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/properties/${row.id}`}
                      className="font-medium text-heading underline "
                    >
                      {row.address}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {row.status ? (
                      <RentStatusBadge status={row.status} />
                    ) : (
                      <span className="text-xs text-muted">Not generated</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-body ">
                    {row.status
                      ? `${formatCurrency(row.rentCollected, currency)} / ${formatCurrency(row.rentDue, currency)}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-body ">
                    {formatCurrency(row.expenses, currency)}
                  </td>
                  <td
                    className={`px-4 py-2 font-medium ${
                      row.netCashFlow < 0 ? 'text-danger-text' : 'text-success-text'
                    }`}
                  >
                    {row.netCashFlow < 0 ? '-' : '+'}{formatCurrency(Math.abs(row.netCashFlow), currency)}
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
