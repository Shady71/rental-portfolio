import { describe, expect, it } from 'vitest'
import { formatCurrency } from '@/lib/currency'

describe('formatCurrency', () => {
  it('U-07: formats USD, EUR, GBP, and ILS amounts with the correct symbol', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50')
    expect(formatCurrency(1234.5, 'EUR')).toBe('€1,234.50')
    expect(formatCurrency(1234.5, 'GBP')).toBe('£1,234.50')
    expect(formatCurrency(1234.5, 'ILS')).toBe('₪1,234.50')
  })
})
