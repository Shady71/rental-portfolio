import { PropertyForm } from '@/components/property-form'
import { createProperty } from '../actions'

export default function NewPropertyPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-accent">Add property</h1>
      <PropertyForm
        action={createProperty}
        submitLabel="Add property"
        pendingLabel="Adding…"
        cancelHref="/dashboard/properties"
      />
    </main>
  )
}
