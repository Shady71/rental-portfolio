export const PROPERTY_STATUSES = ['occupied', 'vacant'] as const

export type PropertyStatus = (typeof PROPERTY_STATUSES)[number]

// Must stay in sync with the `status` check constraint on
// public.properties in supabase/schema.sql.
export function isPropertyStatus(value: string): value is PropertyStatus {
  return (PROPERTY_STATUSES as readonly string[]).includes(value)
}

export function formatPropertyStatus(status: PropertyStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function validateAddress(address: string): string | null {
  return address.trim() ? null : 'Address is required.'
}

export function validateMonthlyRent(raw: string): string | null {
  const value = Number(raw)
  return raw.trim() !== '' && Number.isFinite(value) && value > 0
    ? null
    : 'Monthly rent must be a positive number.'
}
