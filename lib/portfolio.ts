import { deriveChargeStatus, round2, type ChargeStatus, type RentChargeCore, type PaymentAmount } from './rent'
import type { PropertyStatus } from './properties'

export type PropertyMonthInput = {
  id: string
  address: string
  status: PropertyStatus
  rent_charges: (RentChargeCore & { payments: PaymentAmount[] })[]
  expenses: { amount: number }[]
}

export type PropertyMonthSummary = {
  id: string
  address: string
  occupied: boolean
  status: ChargeStatus | null
  rentDue: number
  rentCollected: number
  rentOutstanding: number
  expenses: number
  netCashFlow: number
}

/** Combines a property's current-month charge, payments, and expenses into one summary row. Pure. */
export function summarizePropertyMonth(
  property: PropertyMonthInput,
  today: Date = new Date()
): PropertyMonthSummary {
  const occupied = property.status === 'occupied'
  const expenses = round2(property.expenses.reduce((sum, expense) => sum + expense.amount, 0))
  const charge = property.rent_charges[0] ?? null

  if (!charge) {
    return {
      id: property.id,
      address: property.address,
      occupied,
      status: null,
      rentDue: 0,
      rentCollected: 0,
      rentOutstanding: 0,
      expenses,
      netCashFlow: round2(-expenses),
    }
  }

  const { status, totalPaid, remaining } = deriveChargeStatus(charge, charge.payments, today)

  return {
    id: property.id,
    address: property.address,
    occupied,
    status,
    rentDue: charge.amount_due,
    rentCollected: totalPaid,
    rentOutstanding: remaining,
    expenses,
    netCashFlow: round2(totalPaid - expenses),
  }
}

export type PortfolioSummary = {
  totalProperties: number
  occupiedCount: number
  vacantCount: number
  rentCollected: number
  rentOutstanding: number
  totalExpenses: number
  netCashFlow: number
  overdueCount: number
}

/** Rolls per-property summaries up into portfolio-wide totals. Pure. */
export function summarizePortfolio(properties: PropertyMonthSummary[]): PortfolioSummary {
  const totalProperties = properties.length
  const occupiedCount = properties.filter((property) => property.occupied).length
  const rentCollected = round2(properties.reduce((sum, property) => sum + property.rentCollected, 0))
  const rentOutstanding = round2(
    properties.reduce((sum, property) => sum + property.rentOutstanding, 0)
  )
  const totalExpenses = round2(properties.reduce((sum, property) => sum + property.expenses, 0))
  const overdueCount = properties.filter((property) => property.status === 'overdue').length

  return {
    totalProperties,
    occupiedCount,
    vacantCount: totalProperties - occupiedCount,
    rentCollected,
    rentOutstanding,
    totalExpenses,
    netCashFlow: round2(rentCollected - totalExpenses),
    overdueCount,
  }
}

/** Overdue first, then negative cash flow, then rent still due, then everything else — each group alphabetical. Pure. */
export function sortByAttention(properties: PropertyMonthSummary[]): PropertyMonthSummary[] {
  const rank = (property: PropertyMonthSummary): number => {
    if (property.status === 'overdue') return 0
    if (property.netCashFlow < 0) return 1
    if (property.status === 'due') return 2
    return 3
  }

  return [...properties].sort((a, b) => {
    const rankDiff = rank(a) - rank(b)
    return rankDiff !== 0 ? rankDiff : a.address.localeCompare(b.address)
  })
}
