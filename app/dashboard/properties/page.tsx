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
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
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
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Properties</h1>
        <Link
          href="/dashboard/properties/new"
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Add property
        </Link>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">
            You haven&apos;t added any properties yet.
          </p>
          <Link
            href="/dashboard/properties/new"
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Address</th>
                  <th className="px-4 py-2 font-medium">Monthly rent</th>
                  <th className="px-4 py-2 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {(properties ?? []).map((property) => (
                  <tr key={property.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/properties/${property.id}`}
                        className="font-medium text-zinc-950 underline dark:text-zinc-50"
                      >
                        {property.address}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                      ${property.monthly_rent.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                      {new Date(property.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/properties?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={`rounded-md border border-zinc-300 px-3 py-1.5 dark:border-zinc-700 ${
                  page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                Previous
              </Link>
              <Link
                href={`/dashboard/properties?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={`rounded-md border border-zinc-300 px-3 py-1.5 dark:border-zinc-700 ${
                  page >= totalPages
                    ? 'pointer-events-none opacity-40'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
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
