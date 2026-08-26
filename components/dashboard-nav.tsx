import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/properties', label: 'Properties' },
  { href: '/dashboard/rent', label: 'Rent' },
  { href: '/dashboard/maintenance', label: 'Maintenance' },
] as const

export function DashboardNav() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <nav className="flex gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-zinc-950 dark:hover:text-zinc-50">
              {link.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </div>
    </header>
  )
}
