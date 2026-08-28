import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FoldText from '@/components/fold-text'

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
      'Tenants file requests and follow progress; you track status from start to end without a single text message.',
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
    <div className="flex flex-1 flex-col bg-gradient-to-b from-navy-950 via-navy-950 to-navy-900">
      <header className="border-b border-navy-800">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold text-gold-400">Rental Portfolio</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-gold-400"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="text-center">
            <FoldText
              text="Your Personal Property Manager."
              splitBy="word"
              hinge="top"
              trigger="mount"
              fontSize="clamp(2.5rem, 6vw, 4.5rem)"
              fontWeight={800}
              color="#e8c877"
            />
          </h1>
          <p className="max-w-xl text-lg text-slate-300">
            Track rent, expenses, and cash flow across your rental portfolio — in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="rounded-md bg-gold-500 px-6 py-3 text-sm font-medium text-navy-950 transition-colors hover:bg-gold-400"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-navy-700 px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-gold-500 hover:text-gold-400"
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 pb-24 sm:grid-cols-3 sm:px-6">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-navy-800 bg-navy-900/60 p-6">
              <h3 className="mb-2 font-bold text-gold-400">{feature.title}</h3>
              <p className="text-sm text-slate-300">{feature.description}</p>
            </div>
          ))}
        </section>

        <p className="pb-10 text-center text-xs text-slate-500">For landlords and their tenants.</p>
      </main>
    </div>
  )
}
