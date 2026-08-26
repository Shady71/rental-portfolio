import Link from 'next/link'

export default function PropertyNotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Property not found</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        This property doesn&apos;t exist, or it doesn&apos;t belong to your account.
      </p>
      <Link
        href="/dashboard/properties"
        className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        Back to properties
      </Link>
    </main>
  )
}
