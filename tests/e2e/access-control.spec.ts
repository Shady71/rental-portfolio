import { test as base, expect } from '@playwright/test'
import { test } from './fixtures'

base.describe('UI-01: unauthenticated access to a protected page redirects to login', () => {
  base('dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  base('portal', async ({ page }) => {
    await page.goto('/portal')
    await expect(page).toHaveURL('/login')
  })
})

test.describe("UI-02: role-based routing redirects tenants and landlords away from each other's pages", () => {
  test('tenant visiting /dashboard is redirected to /portal', async ({ tenantPage }) => {
    await tenantPage.goto('/dashboard')
    await expect(tenantPage).toHaveURL('/portal')
  })

  test('landlord visiting /portal is redirected to /dashboard', async ({ landlordPage }) => {
    await landlordPage.goto('/portal')
    await expect(landlordPage).toHaveURL('/dashboard')
  })
})

test('UI-07: logout ends the session and protected pages become unreachable', async ({ landlordPage }) => {
  await landlordPage.goto('/dashboard')
  await landlordPage.getByRole('button', { name: 'Log out' }).click()
  await expect(landlordPage).toHaveURL('/login')

  await landlordPage.goto('/dashboard')
  await expect(landlordPage).toHaveURL('/login')
})
