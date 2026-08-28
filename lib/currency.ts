export const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'ILS'] as const

export type CurrencyCode = (typeof CURRENCY_CODES)[number]

// Must stay in sync with the `currency` check constraint on
// public.profiles in supabase/schema.sql.
export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value)
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}
