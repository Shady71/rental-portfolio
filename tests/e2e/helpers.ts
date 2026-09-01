import type { Page } from '@playwright/test'
import { expect } from './fixtures'

/** A unique, easily-identifiable, sortable label for anything a test creates. */
export function uniqueLabel(prefix: string): string {
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  return `[E2E] ${prefix} ${stamp}`
}

/** The current calendar month, formatted the same way lib/rent.ts's formatPeriod does. */
export function currentMonthLabel(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Creates a property via the UI and returns its id (parsed from the detail page URL). */
export async function createProperty(
  page: Page,
  options: { address: string; monthlyRent: number; status?: 'occupied' | 'vacant' }
): Promise<string> {
  await page.goto('/dashboard/properties/new')
  await page.getByLabel('Address').fill(options.address)
  await page.getByLabel('Monthly rent').fill(String(options.monthlyRent))
  if (options.status) {
    await page.getByLabel('Status').selectOption(options.status)
  }
  await page.getByRole('button', { name: 'Add property' }).click()
  await expect(page).toHaveURL('/dashboard/properties')

  await page.getByRole('link', { name: options.address }).click()
  await expect(page).toHaveURL(/\/dashboard\/properties\/[^/]+$/)
  const match = page.url().match(/\/dashboard\/properties\/([^/]+)$/)
  if (!match) throw new Error(`Could not extract property id from URL: ${page.url()}`)
  return match[1]
}

/**
 * Deletes a property via the UI. Safe to call even if it no longer exists:
 * a stale id renders Next's not-found page at the same URL (no redirect),
 * so this checks the confirm button is actually there before clicking it.
 */
export async function deleteProperty(page: Page, propertyId: string): Promise<void> {
  await page.goto(`/dashboard/properties/${propertyId}/delete`)
  const confirmButton = page.getByRole('button', { name: 'Yes, delete this property' })
  if ((await confirmButton.count()) > 0) {
    await confirmButton.click()
    await expect(page).toHaveURL('/dashboard/properties')
  }
}

/** Clicks "Generate this month's charges" from the rent overview page. */
export async function generateCharges(page: Page): Promise<void> {
  await page.goto('/dashboard/rent')
  await page.getByRole('button', { name: "Generate this month's charges" }).click()
  await expect(page.getByText(/Created \d+ charge/)).toBeVisible()
}

/**
 * Reads the value rendered directly after a summary-card-style label — a
 * `<p>label</p><p>value</p>` pair, as used throughout the dashboard. Scoped
 * to the `<p>` tag specifically since some of these labels (e.g.
 * "Expenses") are exactly duplicated by a `<th>` table header elsewhere on
 * the same page.
 */
export async function readLabeledValue(page: Page, exactLabel: string): Promise<string> {
  const label = page.locator('p').filter({ hasText: new RegExp(`^${exactLabel}$`) })
  const value = label.locator('xpath=following-sibling::p[1]')
  return (await value.textContent())?.trim() ?? ''
}
