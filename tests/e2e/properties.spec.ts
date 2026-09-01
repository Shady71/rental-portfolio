import { test, expect } from './fixtures'
import { createProperty, deleteProperty, uniqueLabel } from './helpers'

test('E-01: landlord adds, edits, and deletes a property; it appears/updates/disappears in the list', async ({
  landlordPage,
}) => {
  const address = uniqueLabel('E-01 Property')
  const editedAddress = `${address} (edited)`
  let propertyId: string | undefined

  try {
    propertyId = await createProperty(landlordPage, { address, monthlyRent: 1200 })

    // Appears in the paginated list (newest first, so always page 1).
    await landlordPage.goto('/dashboard/properties')
    await expect(landlordPage.getByRole('link', { name: address })).toBeVisible()

    // Edit.
    await landlordPage.goto(`/dashboard/properties/${propertyId}/edit`)
    await landlordPage.getByLabel('Address').fill(editedAddress)
    await landlordPage.getByLabel('Monthly rent').fill('1500')
    await landlordPage.getByRole('button', { name: 'Save changes' }).click()
    await expect(landlordPage).toHaveURL(`/dashboard/properties/${propertyId}`)
    await expect(landlordPage.getByRole('heading', { name: editedAddress })).toBeVisible()

    // Updates in the list.
    await landlordPage.goto('/dashboard/properties')
    await expect(landlordPage.getByRole('link', { name: editedAddress })).toBeVisible()
    await expect(landlordPage.getByRole('link', { name: address, exact: true })).toHaveCount(0)

    // Delete.
    await deleteProperty(landlordPage, propertyId)
    propertyId = undefined
    await expect(landlordPage.getByRole('link', { name: editedAddress })).toHaveCount(0)
  } finally {
    if (propertyId) await deleteProperty(landlordPage, propertyId)
  }
})

test('UI-04: an invalid property form shows the field error and keeps what was typed', async ({ landlordPage }) => {
  const address = uniqueLabel('UI-04')

  await landlordPage.goto('/dashboard/properties/new')
  await landlordPage.getByLabel('Address').fill(address)
  await landlordPage.getByLabel('Monthly rent').fill('-100')
  await landlordPage.getByRole('button', { name: 'Add property' }).click()

  await expect(landlordPage.getByText('Monthly rent must be a positive number.')).toBeVisible()
  await expect(landlordPage.getByLabel('Address')).toHaveValue(address)
  await expect(landlordPage.getByLabel('Monthly rent')).toHaveValue('-100')
  // Nothing was created — the action returns early on validation failure — so
  // there's nothing to clean up.
})

test('X-08: pagination controls are disabled at the first and last page', async ({ landlordPage }) => {
  const PAGE_SIZE = 10
  const createdIds: string[] = []

  try {
    await landlordPage.goto('/dashboard/properties?page=1')
    const totalText = await landlordPage.getByText(/Page \d+ of \d+ \(\d+ total\)/).textContent()
    const total = Number(totalText?.match(/\((\d+) total\)/)?.[1] ?? '0')

    // Ensure at least two pages exist, without assuming how many properties
    // the account already has.
    const needed = Math.max(0, PAGE_SIZE + 1 - total)
    for (let i = 0; i < needed; i++) {
      const id = await createProperty(landlordPage, {
        address: uniqueLabel(`X-08 Filler ${i}`),
        monthlyRent: 1000,
      })
      createdIds.push(id)
    }

    await landlordPage.goto('/dashboard/properties?page=1')
    const previousLink = landlordPage.getByRole('link', { name: 'Previous' })
    const nextLink = landlordPage.getByRole('link', { name: 'Next' })
    await expect(previousLink).toHaveAttribute('aria-disabled', 'true')
    await expect(nextLink).toHaveAttribute('aria-disabled', 'false')

    const totalPages = Number(
      (await landlordPage.getByText(/Page \d+ of \d+ \(\d+ total\)/).textContent())?.match(
        /Page \d+ of (\d+)/
      )?.[1] ?? '1'
    )
    await landlordPage.goto(`/dashboard/properties?page=${totalPages}`)
    await expect(landlordPage.getByRole('link', { name: 'Previous' })).toHaveAttribute('aria-disabled', 'false')
    await expect(landlordPage.getByRole('link', { name: 'Next' })).toHaveAttribute('aria-disabled', 'true')
  } finally {
    for (const id of createdIds) await deleteProperty(landlordPage, id)
  }
})
