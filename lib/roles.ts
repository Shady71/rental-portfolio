export const ROLES = ['landlord', 'tenant'] as const

export type Role = (typeof ROLES)[number]

// Must stay in sync with the `role` check constraint on
// public.profiles in supabase/schema.sql.
export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value)
}
