export type ChargeStatus = 'paid' | 'due' | 'overdue'

export type RentChargeCore = {
  amount_due: number
  due_date: string
}

export type PaymentAmount = {
  amount: number
}

export type RentChargeWithPayments = RentChargeCore & {
  id: string
  period: string
  payments: { id: string; amount: number; paid_at: string }[]
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Derives a charge's status and remaining balance from its payments.
 * Pure and side-effect free so it can be unit tested without a database.
 */
export function deriveChargeStatus(
  charge: RentChargeCore,
  payments: PaymentAmount[],
  today: Date = new Date()
): { status: ChargeStatus; totalPaid: number; remaining: number } {
  const totalPaid = round2(payments.reduce((sum, payment) => sum + payment.amount, 0))
  const remaining = round2(Math.max(0, charge.amount_due - totalPaid))

  if (remaining === 0) {
    return { status: 'paid', totalPaid, remaining: 0 }
  }

  const isOverdue = charge.due_date < toISODate(today)
  return { status: isOverdue ? 'overdue' : 'due', totalPaid, remaining }
}

export const RENT_HISTORY_PAGE_SIZE = 12

export function getCurrentPeriod(today: Date = new Date()): string {
  return `${toISODate(today).slice(0, 7)}-01`
}

export function getDefaultDueDate(today: Date = new Date()): string {
  return `${toISODate(today).slice(0, 7)}-10`
}

/**
 * Given a period ('YYYY-MM-01'), returns the first day of the following
 * month — the exclusive upper bound for filtering rows within that month.
 */
export function getNextPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
