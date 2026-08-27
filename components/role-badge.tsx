type Role = 'landlord' | 'tenant'

const LABELS: Record<Role, string> = {
  landlord: 'Landlord',
  tenant: 'Tenant',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {LABELS[role]}
    </span>
  )
}
