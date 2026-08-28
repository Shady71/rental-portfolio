import Link from 'next/link'

export default function PropertyNotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-accent">Property not found</h1>
      <p className="text-muted ">
        This property doesn&apos;t exist, or it doesn&apos;t belong to your account.
      </p>
      <Link
        href="/dashboard/properties"
        className="rounded-md bg-surface-hover px-4 py-2 text-sm font-medium text-heading transition-colors hover:bg-edge-strong"
      >
        Back to properties
      </Link>
    </main>
  )
}
