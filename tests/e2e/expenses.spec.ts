import { test, expect } from './fixtures'
import { createProperty, deleteProperty, readLabeledValue, uniqueLabel } from './helpers'

function nextMonthDateISO(): string {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return next.toISOString().slice(0, 10)
}

test('X-03: a future-dated expense shows "Upcoming" and does not change this month\'s dashboard totals', async ({
  landlordPage,
}) => {
  const address = uniqueLabel('X-03 Property')
  const propertyId = await createProperty(landlordPage, { address, monthlyRent: 1000, status: 'vacant' })

  try {
    await landlordPage.goto('/dashboard')
    const expensesBefore = await readLabeledValue(landlordPage, 'Expenses')
    const netCashFlowBefore = await readLabeledValue(landlordPage, 'Net cash flow this month')

    await landlordPage.goto(`/dashboard/properties/${propertyId}`)
    // "Add expense" is both the <summary> toggle text and the submit
    // button's text — target the summary by tag, and the button by
    // scoping to its <form>, to avoid matching both.
    const expensesSection = landlordPage.getByRole('heading', { name: 'Expenses' }).locator('..')
    await expensesSection.locator('summary', { hasText: 'Add expense' }).click()
    const form = expensesSection.locator('form').filter({ hasText: 'Add expense' })
    await form.getByLabel('Amount').fill('250')
    await form.getByLabel('Category').selectOption('maintenance')
    await form.getByLabel('Date').fill(nextMonthDateISO())
    await form.getByRole('button', { name: 'Add expense' }).click()

    await expect(expensesSection.getByText('Upcoming', { exact: true })).toBeVisible()

    await landlordPage.goto('/dashboard')
    const expensesAfter = await readLabeledValue(landlordPage, 'Expenses')
    const netCashFlowAfter = await readLabeledValue(landlordPage, 'Net cash flow this month')

    expect(expensesAfter).toBe(expensesBefore)
    expect(netCashFlowAfter).toBe(netCashFlowBefore)
  } finally {
    await deleteProperty(landlordPage, propertyId)
  }
})
