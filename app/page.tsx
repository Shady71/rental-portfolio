import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import BlurText from '@/components/blur-text'

const FEATURES = [
  {
    title: 'Rent tracking',
    description:
      "Generate monthly charges, record payments, and see who's paid, who's due, and who's overdue — for every property, automatically.",
  },
  {
    title: 'Cash-flow dashboard',
    description:
      "One view of what's coming in, what's going out, and your net cash flow this month across your whole portfolio.",
  },
  {
    title: 'Maintenance requests',
    description:
      'Tenants file requests and follow progress; you track status from open to resolved without a single text message.',
  },
] as const

export default async function LandingPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (data) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.claims.sub)
      .maybeSingle()

    redirect(profile?.role === 'tenant' ? '/portal' : '/dashboard')
  }

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Rental Portfolio</span>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
          <BlurText
            text="See your rental portfolio clearly."
            animateBy="words"
            direction="top"
            delay={80}
            className="justify-center text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl"
          />
          <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Track rent, expenses, and cash flow across your rental portfolio — in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="rounded-md bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 pb-24 sm:grid-cols-3 sm:px-6">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-2 font-semibold text-zinc-950 dark:text-zinc-50">{feature.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </section>

        <p className="pb-10 text-center text-xs text-zinc-400 dark:text-zinc-600">
          For landlords and their tenants.
        </p>
      </main>
    </div>
  )
}
