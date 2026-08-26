import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select('id, address, monthly_rent, purchase_price, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !property) {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/properties"
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            ← All properties
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {property.address}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/properties/${property.id}/edit`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Edit
          </Link>
          <Link
            href={`/dashboard/properties/${property.id}/delete`}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">Monthly rent</dt>
          <dd className="text-lg text-zinc-950 dark:text-zinc-50">
            ${property.monthly_rent.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">Purchase price</dt>
          <dd className="text-lg text-zinc-950 dark:text-zinc-50">
            {property.purchase_price ? `$${property.purchase_price.toLocaleString()}` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">Added on</dt>
          <dd className="text-lg text-zinc-950 dark:text-zinc-50">
            {new Date(property.created_at).toLocaleDateString()}
          </dd>
        </div>
      </dl>

      <section className="flex flex-col gap-4">
        {(['Rent', 'Expenses', 'Maintenance'] as const).map((section) => (
          <div
            key={section}
            className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <h2 className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">{section}</h2>
            Coming soon.
          </div>
        ))}
      </section>
    </main>
  )
}
