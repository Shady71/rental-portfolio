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

test('UI-04: server-side validation rejects input the browser lets through, and shows the field error', async ({
  landlordPage,
}) => {
  // The address input is `required` but has no pattern/min, so the browser
  // only blocks a truly empty value — a whitespace-only one satisfies
  // `required` client-side and reaches the Server Action, where
  // validateAddress's own `.trim()` check correctly rejects it. This is
  // the only way to exercise that server-side error honestly through the
  // real form (see lib/properties.ts).
  const whitespaceAddress = '   '
  const monthlyRent = '1000'

  await landlordPage.goto('/dashboard/properties/new')
  await landlordPage.getByLabel('Address').fill(whitespaceAddress)
  await landlordPage.getByLabel('Monthly rent').fill(monthlyRent)
  await landlordPage.getByRole('button', { name: 'Add property' }).click()

  await expect(landlordPage.getByText('Address is required.')).toBeVisible()
  await expect(landlordPage).toHaveURL('/dashboard/properties/new')
  // NOT asserting the typed values are preserved: confirmed against the
  // real app that this create form resets ALL its fields (not just the
  // errored one) after the Server Action settles, regardless of which
  // field had an error — it has no defaultValue anchoring any input to
  // what was just submitted (unlike the edit form, which binds
  // defaultValue to the server-loaded record). That's a real UX gap
  // flagged in the report alongside this fix, not something to assert
  // around — see tests/README.md.
  // Nothing was created — the action returns early on validation failure —
  // so there's nothing to clean up.
})

test("UI-04: the browser's own validation blocks an obviously invalid value before the server is ever involved", async ({
  landlordPage,
}) => {
  const address = uniqueLabel('UI-04 client-blocked')

  await landlordPage.goto('/dashboard/properties/new')
  await landlordPage.getByLabel('Address').fill(address)
  const rentInput = landlordPage.getByLabel('Monthly rent')
  await rentInput.fill('-100')
  await landlordPage.getByRole('button', { name: 'Add property' }).click()

  // min="0.01" on the input stops the browser from ever submitting the
  // form — the Server Action doesn't run, so its error never renders.
  // toHaveJSProperty only supports a flat property name (see its docs —
  // no nested-path example), so 'validity.valid' would silently check a
  // nonexistent literal key; evaluate() is unambiguous for a nested read.
  const isValid = await rentInput.evaluate((el) => (el as HTMLInputElement).validity.valid)
  expect(isValid).toBe(false)
  await expect(landlordPage).toHaveURL('/dashboard/properties/new')
  await expect(landlordPage.getByText('Monthly rent must be a positive number.')).toHaveCount(0)
  // Nothing was created — the form was never submitted — so there's
  // nothing to clean up.
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
