import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

const PAGE_SIZE = 10

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const { data: properties, count, error } = await supabase
    .from('properties')
    .select('id, address, monthly_rent, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
        <p
          role="alert"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          Could not load properties: {error.message}
        </p>
      </main>
    )
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-accent">Properties</h1>
        <Link
          href="/dashboard/properties/new"
          className="rounded-md bg-surface-hover px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-edge-strong"
        >
          Add property
        </Link>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-edge-strong py-16 text-center ">
          <p className="text-muted ">
            You haven&apos;t added any properties yet.
          </p>
          <Link
            href="/dashboard/properties/new"
            className="rounded-md bg-surface-hover px-4 py-2 text-sm font-medium text-heading transition-colors hover:bg-edge-strong"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-edge ">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-raised text-muted  ">
                <tr>
                  <th className="px-4 py-2 font-medium">Address</th>
                  <th className="px-4 py-2 font-medium">Monthly rent</th>
                  <th className="px-4 py-2 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {(properties ?? []).map((property) => (
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
                    <td className="px-4 py-2 text-body ">
                      {new Date(property.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted ">
            <p>
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/properties?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={`rounded-md border border-edge-strong px-3 py-1.5  ${
                  page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-surface-raised'
                }`}
              >
                Previous
              </Link>
              <Link
                href={`/dashboard/properties?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={`rounded-md border border-edge-strong px-3 py-1.5  ${
                  page >= totalPages
                    ? 'pointer-events-none opacity-40'
                    : 'hover:bg-surface-raised'
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
