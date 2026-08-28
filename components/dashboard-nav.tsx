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
    <header className="border-b border-edge ">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <nav className="flex gap-4 text-sm font-medium text-muted ">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </div>
    </header>
  )
}
