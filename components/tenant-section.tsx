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
          <p className="text-sm text-body ">
            Assigned to <span className="font-medium">{tenantName ?? 'Unnamed tenant'}</span>
          </p>
          <UnassignTenantButton propertyId={propertyId} />
        </div>
      ) : (
        <p className="text-sm text-muted ">No tenant assigned.</p>
      )}

      <details>
        <summary className="w-fit cursor-pointer text-sm font-medium text-body underline ">
          {isAssigned ? 'Change tenant' : 'Assign tenant'}
        </summary>
        <AssignTenantForm propertyId={propertyId} />
      </details>
    </div>
  )
}
