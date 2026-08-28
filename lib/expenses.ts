export const EXPENSE_CATEGORIES = [
  'maintenance',
  'tax',
  'insurance',
  'mortgage',
  'utilities',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export type Expense = {
  id: string
  amount: number
  category: ExpenseCategory
  incurred_on: string
  note: string | null
}

// Must stay in sync with the `category` check constraint on
// public.expenses in supabase/schema.sql.
export function isExpenseCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value)
}

export function formatExpenseCategory(category: ExpenseCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isUpcoming(incurredOn: string, today: string = todayISO()): boolean {
  return incurredOn > today
}
