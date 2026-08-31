import { describe, expect, it } from 'vitest'
import { summarizePropertyMonth, summarizePortfolio, type PropertyMonthInput } from '@/lib/portfolio'

const today = new Date('2026-01-15T00:00:00Z')

describe('portfolio aggregation', () => {
  it("U-05: portfolio totals equal the sum of each property's figures, and net cash flow is collected minus expenses", () => {
    const properties: PropertyMonthInput[] = [
      {
        id: 'p1',
        address: '1 Main St',
        status: 'occupied',
        rent_charges: [{ amount_due: 1000, due_date: '2026-01-10', payments: [{ amount: 1000 }] }],
        expenses: [{ amount: 100 }, { amount: 50 }],
      },
      {
        id: 'p2',
        address: '2 Main St',
        status: 'occupied',
        rent_charges: [{ amount_due: 1200, due_date: '2026-01-10', payments: [{ amount: 400 }] }],
        expenses: [{ amount: 75 }],
      },
      {
        id: 'p3',
        address: '3 Main St',
        status: 'vacant',
        rent_charges: [],
        expenses: [],
      },
    ]

    const rows = properties.map((property) => summarizePropertyMonth(property, today))
    const portfolio = summarizePortfolio(rows)

    const expectedCollected = rows.reduce((sum, row) => sum + row.rentCollected, 0)
    const expectedOutstanding = rows.reduce((sum, row) => sum + row.rentOutstanding, 0)
    const expectedExpenses = rows.reduce((sum, row) => sum + row.expenses, 0)

    expect(portfolio.rentCollected).toBe(expectedCollected)
    expect(portfolio.rentOutstanding).toBe(expectedOutstanding)
    expect(portfolio.totalExpenses).toBe(expectedExpenses)
    expect(portfolio.netCashFlow).toBe(portfolio.rentCollected - portfolio.totalExpenses)
  })

  it('U-06: a property marked occupied with no linked tenant still counts as occupied (occupancy derives from status, not tenant_id)', () => {
    // PropertyMonthInput carries no tenant_id at all — occupancy comes
    // solely from `status`, so this fixture is itself proof of independence.
    const property: PropertyMonthInput = {
      id: 'p1',
      address: '1 Main St',
      status: 'occupied',
      rent_charges: [],
      expenses: [],
    }

    const summary = summarizePropertyMonth(property, today)

    expect(summary.occupied).toBe(true)
  })
})
