import { AssignTenantForm } from '@/components/assign-tenant-form'
import { UnassignTenantButton } from '@/components/unassign-tenant-button'

export function TenantSection({
  propertyId,
  isAssigned,
  tenantName,
}: {
  propertyId: string
  isAssigned: boolean
  tenantName: string | null
}) {
  return (
    <div className="flex flex-col gap-3">
      {isAssigned ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Assigned to <span className="font-medium">{tenantName ?? 'Unnamed tenant'}</span>
          </p>
          <UnassignTenantButton propertyId={propertyId} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No tenant assigned.</p>
      )}

      <details>
        <summary className="w-fit cursor-pointer text-sm font-medium text-zinc-700 underline dark:text-zinc-300">
          {isAssigned ? 'Change tenant' : 'Assign tenant'}
        </summary>
        <AssignTenantForm propertyId={propertyId} />
      </details>
    </div>
  )
}
