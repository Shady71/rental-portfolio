import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { formatPeriod, getCurrentPeriod, getNextPeriod } from '@/lib/rent'
import { summarizePropertyMonth, summarizePortfolio, sortByAttention, type PropertyMonthInput } from '@/lib/portfolio'
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

  const { data: profile } = await supabase.from('profiles').select('full_name, role').maybeSingle()
  const displayName = profile?.full_name?.trim() || authData.claims.email || 'there'

  const { data: properties, error } = await supabase
    .from('properties')
    .select(
      `
      id,
      address,
      tenant_id,
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
    .eq('rent_charges.period', period)
    .gte('expenses.incurred_on', period)
    .lt('expenses.incurred_on', periodEnd)
    .returns<PropertyMonthInput[]>()

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
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
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Welcome, {displayName}</h1>
        <div className="mt-1 flex items-center gap-2">
          <RoleBadge role={profile?.role ?? 'landlord'} />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatPeriod(period)}</p>
        </div>
      </div>

      <div
        className={`rounded-lg border p-6 ${
          isPositive
            ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
            : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
        }`}
      >
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Net cash flow this month</p>
        <p
          className={`text-4xl font-bold ${
            isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
          }`}
        >
          {isPositive ? '+' : '-'}${Math.abs(portfolio.netCashFlow).toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ${portfolio.rentCollected.toLocaleString()} collected − ${portfolio.totalExpenses.toLocaleString()} in
          expenses
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Properties</p>
          <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{portfolio.totalProperties}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {portfolio.occupiedCount} occupied · {portfolio.vacantCount} vacant
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Rent collected</p>
          <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            ${portfolio.rentCollected.toLocaleString()}
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Rent outstanding</p>
          <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            ${portfolio.rentOutstanding.toLocaleString()}
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Expenses</p>
          <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            ${portfolio.totalExpenses.toLocaleString()}
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Overdue</p>
          <p
            className={`text-xl font-semibold ${
              portfolio.overdueCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-zinc-950 dark:text-zinc-50'
            }`}
          >
            {portfolio.overdueCount}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">You don&apos;t have any properties yet.</p>
          <Link
            href="/dashboard/properties/new"
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
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
                <tr key={row.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/properties/${row.id}`}
                      className="font-medium text-zinc-950 underline dark:text-zinc-50"
                    >
                      {row.address}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {row.status ? (
                      <RentStatusBadge status={row.status} />
                    ) : (
                      <span className="text-xs text-zinc-400">Not generated</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                    {row.status ? `$${row.rentCollected.toLocaleString()} / $${row.rentDue.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                    ${row.expenses.toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-2 font-medium ${
                      row.netCashFlow < 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                    }`}
                  >
                    {row.netCashFlow < 0 ? '-' : '+'}${Math.abs(row.netCashFlow).toLocaleString()}
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
