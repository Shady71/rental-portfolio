import { describe, expect, it } from 'vitest'
import { validateAddress, validateMonthlyRent } from '@/lib/properties'
import { validatePaymentAmount, validatePaymentDate } from '@/lib/rent'
import { isExpenseCategory } from '@/lib/expenses'
import { isRole } from '@/lib/roles'
import { validateTicketTitle } from '@/lib/maintenance'

describe('property validation', () => {
  it('V-01: rejects an empty address', () => {
    expect(validateAddress('')).not.toBeNull()
    expect(validateAddress('   ')).not.toBeNull()
    expect(validateAddress('1 Main St')).toBeNull()
  })

  it('V-02: rejects a negative or zero monthly rent', () => {
    expect(validateMonthlyRent('0')).not.toBeNull()
    expect(validateMonthlyRent('-100')).not.toBeNull()
    expect(validateMonthlyRent('1000')).toBeNull()
  })

  it('V-03: rejects a non-numeric monthly rent', () => {
    expect(validateMonthlyRent('abc')).not.toBeNull()
    expect(validateMonthlyRent('')).not.toBeNull()
  })
})

describe('payment validation', () => {
  it('V-04: rejects a negative or zero payment amount', () => {
    expect(validatePaymentAmount('0')).not.toBeNull()
    expect(validatePaymentAmount('-50')).not.toBeNull()
    expect(validatePaymentAmount('50')).toBeNull()
  })

  it('V-05: rejects a future-dated payment', () => {
    const today = '2026-01-15'
    expect(validatePaymentDate('2026-02-01', today)).not.toBeNull()
    expect(validatePaymentDate('2026-01-15', today)).toBeNull()
    expect(validatePaymentDate('', today)).not.toBeNull()
  })
})

describe('expense validation', () => {
  it('V-06: rejects an invalid expense category', () => {
    expect(isExpenseCategory('bogus')).toBe(false)
    expect(isExpenseCategory('maintenance')).toBe(true)
  })
})

describe('role validation', () => {
  it('V-07: rejects an invalid role', () => {
    expect(isRole('admin')).toBe(false)
    expect(isRole('landlord')).toBe(true)
    expect(isRole('tenant')).toBe(true)
  })
})

describe('ticket validation', () => {
  it('V-08: rejects an empty ticket title', () => {
    expect(validateTicketTitle('')).not.toBeNull()
    expect(validateTicketTitle('   ')).not.toBeNull()
    expect(validateTicketTitle('Leaky faucet')).toBeNull()
  })
})
