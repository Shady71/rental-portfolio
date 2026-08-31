import { describe, expect, it } from 'vitest'
import { deriveChargeStatus } from '@/lib/rent'

describe('deriveChargeStatus', () => {
  it("U-01: unpaid charge before due date is 'due'", () => {
    const result = deriveChargeStatus(
      { amount_due: 1000, due_date: '2026-01-10' },
      [],
      new Date('2026-01-05T00:00:00Z')
    )
    expect(result).toEqual({ status: 'due', totalPaid: 0, remaining: 1000 })
  })

  it("U-02: unpaid charge after due date is 'overdue'", () => {
    const result = deriveChargeStatus(
      { amount_due: 1000, due_date: '2026-01-10' },
      [],
      new Date('2026-01-15T00:00:00Z')
    )
    expect(result).toEqual({ status: 'overdue', totalPaid: 0, remaining: 1000 })
  })

  it("U-03: a payment exactly covering the amount due is 'paid'", () => {
    const result = deriveChargeStatus(
      { amount_due: 1000, due_date: '2026-01-10' },
      [{ amount: 1000 }],
      new Date('2026-01-15T00:00:00Z')
    )
    expect(result).toEqual({ status: 'paid', totalPaid: 1000, remaining: 0 })
  })

  it("U-04: multiple partial payments summing to the full amount is 'paid'", () => {
    const result = deriveChargeStatus(
      { amount_due: 1000, due_date: '2026-01-10' },
      [{ amount: 400 }, { amount: 350 }, { amount: 250 }],
      new Date('2026-01-15T00:00:00Z')
    )
    expect(result).toEqual({ status: 'paid', totalPaid: 1000, remaining: 0 })
  })

  it('X-01: an overpayment clamps the remaining balance at 0, never negative', () => {
    const result = deriveChargeStatus(
      { amount_due: 1000, due_date: '2026-01-10' },
      [{ amount: 1500 }],
      new Date('2026-01-15T00:00:00Z')
    )
    expect(result.remaining).toBe(0)
    expect(result.status).toBe('paid')
  })

  it("X-02: a due date exactly today is 'due', not 'overdue' (boundary)", () => {
    const result = deriveChargeStatus(
      { amount_due: 1000, due_date: '2026-01-10' },
      [],
      new Date('2026-01-10T12:00:00Z')
    )
    expect(result.status).toBe('due')
  })
})
