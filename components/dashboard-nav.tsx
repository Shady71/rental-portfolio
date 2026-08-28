import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import { CurrencySelector } from '@/components/currency-selector'
import type { CurrencyCode } from '@/lib/currency'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/properties', label: 'Properties' },
  { href: '/dashboard/rent', label: 'Rent' },
  { href: '/dashboard/maintenance', label: 'Maintenance' },
] as const

export async function DashboardNav() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  let currentCurrency: CurrencyCode = 'USD'
  if (data) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('currency')
      .eq('id', data.claims.sub)
      .maybeSingle()
    if (profile?.currency) {
      currentCurrency = profile.currency as CurrencyCode
    }
  }

  return (
    <header className="border-b border-edge ">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex gap-4 text-sm font-medium text-muted ">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <CurrencySelector currentCurrency={currentCurrency} />
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
