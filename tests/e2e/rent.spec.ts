import { test, expect } from './fixtures'
import { createProperty, deleteProperty, generateCharges, currentMonthLabel, uniqueLabel } from './helpers'

// Selector notes:
// - RentStatusBadge renders the bare word "Due"/"Paid"/"Overdue" as an
//   element's whole text; the charge line separately renders "$X due ·
//   $Y paid" (lowercase, inline). getByText(..., { exact: true }) is
//   required throughout to match only the badge, not that substring.
// - The "Record payment" <summary> toggle and the "Record payment"
//   <button> inside its form have IDENTICAL text, so exact matching alone
//   can't tell them apart — the toggle is targeted by tag (`summary`,
//   which a <button> never matches) and the submit button by scoping to
//   `form` (which the summary is never inside).

test('E-02: landlord generates the month\'s charges, then records a payment; status becomes "Paid"', async ({
  landlordPage,
}) => {
  const address = uniqueLabel('E-02 Property')
  const propertyId = await createProperty(landlordPage, { address, monthlyRent: 1200, status: 'occupied' })

  try {
    await generateCharges(landlordPage)

    await landlordPage.goto(`/dashboard/properties/${propertyId}`)
    const rentSection = landlordPage.getByRole('heading', { name: 'Rent' }).locator('..')
    await expect(rentSection.getByText('Due', { exact: true })).toBeVisible()

    await rentSection.locator('summary', { hasText: 'Record payment' }).click()
    // The amount field defaults to the full remaining balance — submit as-is.
    await rentSection.locator('form').getByRole('button', { name: 'Record payment' }).click()

    await expect(rentSection.getByText('Paid', { exact: true })).toBeVisible()
    await expect(rentSection.getByText('Due', { exact: true })).toHaveCount(0)
  } finally {
    await deleteProperty(landlordPage, propertyId)
  }
})

test('B-03: generating charges twice creates no duplicate charge for the same property/period', async ({
  landlordPage,
}) => {
  const address = uniqueLabel('B-03 Property')
  const propertyId = await createProperty(landlordPage, { address, monthlyRent: 1000, status: 'occupied' })

  try {
    await generateCharges(landlordPage)
    await generateCharges(landlordPage)

    await landlordPage.goto(`/dashboard/properties/${propertyId}`)
    await expect(landlordPage.getByText(currentMonthLabel())).toHaveCount(1)
  } finally {
    await deleteProperty(landlordPage, propertyId)
  }
})

test('B-04: a vacant property receives no charge when generating', async ({ landlordPage }) => {
  const address = uniqueLabel('B-04 Property')
  const propertyId = await createProperty(landlordPage, { address, monthlyRent: 900, status: 'vacant' })

  try {
    await generateCharges(landlordPage)

    await landlordPage.goto(`/dashboard/properties/${propertyId}`)
    await expect(
      landlordPage.getByText("No rent charges yet. Generate this month's charges from the")
    ).toBeVisible()

    await landlordPage.goto('/dashboard/rent')
    const row = landlordPage.getByRole('row').filter({ hasText: address })
    await expect(row.getByText('Not generated')).toBeVisible()
  } finally {
    await deleteProperty(landlordPage, propertyId)
  }
})

test('B-05: a partial payment leaves the charge unpaid with a reduced remaining balance', async ({
  landlordPage,
}) => {
  const address = uniqueLabel('B-05 Property')
  const propertyId = await createProperty(landlordPage, { address, monthlyRent: 1000, status: 'occupied' })

  try {
    await generateCharges(landlordPage)

    await landlordPage.goto(`/dashboard/properties/${propertyId}`)
    const rentSection = landlordPage.getByRole('heading', { name: 'Rent' }).locator('..')
    await rentSection.locator('summary', { hasText: 'Record payment' }).click()

    const form = rentSection.locator('form').filter({ hasText: 'Record payment' })
    await form.locator('input[name="amount"]').fill('400')
    await form.getByRole('button', { name: 'Record payment' }).click()

    await expect(rentSection.getByText('Due', { exact: true })).toBeVisible()
    await expect(rentSection.getByText('Paid', { exact: true })).toHaveCount(0)
    // The "record payment" form's amount field always defaults to the
    // remaining balance — reading it back is a currency-symbol-agnostic way
    // to confirm the balance actually dropped from 1000 to 600.
    await rentSection.locator('summary', { hasText: 'Record payment' }).click()
    await expect(
      rentSection.locator('form').filter({ hasText: 'Record payment' }).locator('input[name="amount"]')
    ).toHaveValue('600')
  } finally {
    await deleteProperty(landlordPage, propertyId)
  }
})

test('B-06: deleting the only payment on a paid charge returns it to due/overdue', async ({ landlordPage }) => {
  const address = uniqueLabel('B-06 Property')
  const propertyId = await createProperty(landlordPage, { address, monthlyRent: 800, status: 'occupied' })

  try {
    await generateCharges(landlordPage)

    await landlordPage.goto(`/dashboard/properties/${propertyId}`)
    const rentSection = landlordPage.getByRole('heading', { name: 'Rent' }).locator('..')
    await rentSection.locator('summary', { hasText: 'Record payment' }).click()
    await rentSection.locator('form').getByRole('button', { name: 'Record payment' }).click()
    await expect(rentSection.getByText('Paid', { exact: true })).toBeVisible()

    await rentSection.locator('summary', { hasText: 'Delete' }).click()
    await rentSection.getByRole('button', { name: 'Confirm delete' }).click()

    await expect(rentSection.getByText('Paid', { exact: true })).toHaveCount(0)
    await expect(rentSection.getByText(/^(Due|Overdue)$/)).toBeVisible()
  } finally {
    await deleteProperty(landlordPage, propertyId)
  }
})

test('X-06: a property with no rent charges shows the empty state', async ({ landlordPage }) => {
  const address = uniqueLabel('X-06 Property')
  const propertyId = await createProperty(landlordPage, { address, monthlyRent: 950, status: 'occupied' })

  try {
    await landlordPage.goto(`/dashboard/properties/${propertyId}`)
    await expect(
      landlordPage.getByText("No rent charges yet. Generate this month's charges from the")
    ).toBeVisible()
  } finally {
    await deleteProperty(landlordPage, propertyId)
  }
})
