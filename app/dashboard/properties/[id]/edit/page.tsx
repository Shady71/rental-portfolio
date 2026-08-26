import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PropertyForm } from '@/components/property-form'
import { updateProperty } from '../../actions'

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select('id, address, monthly_rent, purchase_price')
    .eq('id', id)
    .maybeSingle()

  if (error || !property) {
    notFound()
  }

  const updatePropertyWithId = updateProperty.bind(null, property.id)

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Edit property</h1>
      <PropertyForm
        action={updatePropertyWithId}
        defaultValues={property}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        cancelHref={`/dashboard/properties/${property.id}`}
      />
    </main>
  )
}
