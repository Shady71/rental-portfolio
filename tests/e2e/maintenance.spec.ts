import { test, expect } from './fixtures'
import { uniqueLabel } from './helpers'

// NOTE: maintenance_tickets and ticket_updates are append-only by design —
// there is no delete policy on either table (see supabase/schema.sql), and
// no delete action/UI exists for them. This test's ticket therefore cannot
// be cleaned up afterward; it's named with the [E2E] prefix (via
// uniqueLabel) so it's easy to identify and safe to leave, or prune
// manually later. See tests/README.md.

test('E-03: tenant files a maintenance request; landlord sees it, advances it, and adds a note; tenant sees the note', async ({
  landlordPage,
  tenantPage,
}) => {
  const title = uniqueLabel('E-03 Ticket')
  const note = uniqueLabel('E-03 Progress note')

  // Tenant files the request.
  await tenantPage.goto('/portal')
  await tenantPage.locator('summary', { hasText: 'File a maintenance request' }).click()
  const tenantForm = tenantPage.locator('form').filter({ hasText: 'File request' })
  await tenantForm.getByLabel('Title').fill(title)
  await tenantForm.getByRole('button', { name: 'File request' }).click()

  const tenantTicketItem = tenantPage.locator('li').filter({ hasText: title })
  await expect(tenantTicketItem.getByText('Open', { exact: true })).toBeVisible()

  // Landlord finds it via the maintenance overview, then opens the property.
  await landlordPage.goto('/dashboard/maintenance')
  const overviewRow = landlordPage.getByRole('row').filter({ hasText: title })
  await overviewRow.getByRole('link').click()

  const maintenanceSection = landlordPage.getByRole('heading', { name: 'Maintenance' }).locator('..')
  const landlordTicketItem = maintenanceSection.locator('li').filter({ hasText: title })
  await expect(landlordTicketItem.getByText('Open', { exact: true })).toBeVisible()

  // Advance status.
  await landlordTicketItem.getByRole('button', { name: 'Mark as In Progress' }).click()
  await expect(landlordTicketItem.getByText('In Progress', { exact: true })).toBeVisible()

  // Add a progress note.
  await landlordTicketItem.getByPlaceholder('Add a progress note…').fill(note)
  await landlordTicketItem.getByRole('button', { name: 'Add note' }).click()
  await expect(landlordTicketItem.getByText(note)).toBeVisible()
  await expect(landlordTicketItem.getByText('You', { exact: true })).toBeVisible()

  // Tenant sees the note, attributed to the landlord.
  await tenantPage.goto('/portal')
  const tenantTicketItemAfter = tenantPage.locator('li').filter({ hasText: title })
  await expect(tenantTicketItemAfter.getByText('In Progress', { exact: true })).toBeVisible()
  await expect(tenantTicketItemAfter.getByText(note)).toBeVisible()
  await expect(tenantTicketItemAfter.getByText('Landlord', { exact: true })).toBeVisible()
})
