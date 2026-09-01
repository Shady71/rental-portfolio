import { test, expect } from './fixtures'
import { createProperty, deleteProperty, uniqueLabel } from './helpers'

test('X-04: a landlord with no properties sees the empty state, not a blank dashboard', async ({
  emptyLandlordPage,
}) => {
  await emptyLandlordPage.goto('/dashboard')
  await expect(emptyLandlordPage.getByText("You don't have any properties yet.")).toBeVisible()

  await emptyLandlordPage.goto('/dashboard/properties')
  await expect(emptyLandlordPage.getByText("You haven't added any properties yet.")).toBeVisible()
})

test('X-05: a tenant with no assigned property sees the empty state, not a blank portal', async ({
  unassignedTenantPage,
}) => {
  await unassignedTenantPage.goto('/portal')
  await expect(
    unassignedTenantPage.getByText('No property assigned yet. Contact your landlord to get set up.')
  ).toBeVisible()
})

test('UI-06: a fresh property renders empty states for tenant, expenses, and maintenance — not blank areas', async ({
  landlordPage,
}) => {
  const address = uniqueLabel('UI-06 Property')
  const propertyId = await createProperty(landlordPage, { address, monthlyRent: 1000 })

  try {
    await landlordPage.goto(`/dashboard/properties/${propertyId}`)
    await expect(landlordPage.getByText('No tenant assigned.')).toBeVisible()
    await expect(landlordPage.getByText('No expenses logged yet.')).toBeVisible()
    await expect(landlordPage.getByText('No maintenance requests yet.')).toBeVisible()
  } finally {
    await deleteProperty(landlordPage, propertyId)
  }
})
