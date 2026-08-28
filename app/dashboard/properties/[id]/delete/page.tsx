import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { DeletePropertyForm } from '@/components/delete-property-form'

export default async function DeletePropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select('id, address')
    .eq('id', id)
    .maybeSingle()

  if (error || !property) {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-accent">Delete property</h1>
      <p className="text-muted ">
        Are you sure you want to delete <strong>{property.address}</strong>? This will also
        permanently delete its rent charges, expenses, and maintenance tickets. This can&apos;t be
        undone.
      </p>
      <div className="flex items-center gap-3">
        <DeletePropertyForm propertyId={property.id} />
        <Link
          href={`/dashboard/properties/${property.id}`}
          className="text-sm text-muted underline "
        >
          Cancel
        </Link>
      </div>
    </main>
  )
}
