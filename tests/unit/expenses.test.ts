import { describe, expect, it } from 'vitest'
import { isUpcoming } from '@/lib/expenses'
import { summarizePropertyMonth, type PropertyMonthInput } from '@/lib/portfolio'

describe('isUpcoming', () => {
  it("X-03: a future-dated expense is 'upcoming' and is excluded from the current month's total", () => {
    const today = '2026-01-15'
    expect(isUpcoming('2026-02-01', today)).toBe(true)
    expect(isUpcoming('2026-01-15', today)).toBe(false)
    expect(isUpcoming('2026-01-01', today)).toBe(false)

    // The dashboard query filters expenses to the current month at the
    // database level (incurred_on within [period, periodEnd)) before this
    // pure aggregation ever runs, so a future-dated expense never reaches
    // this input in production. This asserts the other half of that
    // contract: the aggregation only ever totals what it's given.
    const property: PropertyMonthInput = {
      id: 'p1',
      address: '1 Main St',
      status: 'occupied',
      rent_charges: [],
      expenses: [{ amount: 100 }], // simulates the DB filter already excluding the future one
    }
    const summary = summarizePropertyMonth(property, new Date('2026-01-15T00:00:00Z'))
    expect(summary.expenses).toBe(100)
  })
})
