type Role = 'landlord' | 'tenant'

const LABELS: Record<Role, string> = {
  landlord: 'Landlord',
  tenant: 'Tenant',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-body">
      {LABELS[role]}
    </span>
  )
}
