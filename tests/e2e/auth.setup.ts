import { test as setup, expect } from '@playwright/test'
import {
  LANDLORD_STORAGE_STATE,
  TENANT_STORAGE_STATE,
  EMPTY_LANDLORD_STORAGE_STATE,
  UNASSIGNED_TENANT_STORAGE_STATE,
} from './auth-paths'

async function login(page: import('@playwright/test').Page, email: string, password: string, expectedUrl: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(expectedUrl)
}

setup('authenticate as landlord', async ({ page }) => {
  const email = process.env.TEST_LANDLORD_EMAIL
  const password = process.env.TEST_LANDLORD_PASSWORD
  if (!email || !password) {
    throw new Error(
      'TEST_LANDLORD_EMAIL / TEST_LANDLORD_PASSWORD are required — see tests/README.md.'
    )
  }
  await login(page, email, password, '/dashboard')
  await page.context().storageState({ path: LANDLORD_STORAGE_STATE })
})

setup('authenticate as tenant', async ({ page }) => {
  const email = process.env.TEST_TENANT_EMAIL
  const password = process.env.TEST_TENANT_PASSWORD
  if (!email || !password) {
    throw new Error(
      'TEST_TENANT_EMAIL / TEST_TENANT_PASSWORD are required — see tests/README.md.'
    )
  }
  await login(page, email, password, '/portal')
  await page.context().storageState({ path: TENANT_STORAGE_STATE })
})

setup('authenticate as empty landlord (optional)', async ({ page }) => {
  const email = process.env.TEST_EMPTY_LANDLORD_EMAIL
  const password = process.env.TEST_EMPTY_LANDLORD_PASSWORD
  setup.skip(!email || !password, 'TEST_EMPTY_LANDLORD_EMAIL/PASSWORD not set — X-04 will skip.')
  await login(page, email!, password!, '/dashboard')
  await page.context().storageState({ path: EMPTY_LANDLORD_STORAGE_STATE })
})

setup('authenticate as unassigned tenant (optional)', async ({ page }) => {
  const email = process.env.TEST_UNASSIGNED_TENANT_EMAIL
  const password = process.env.TEST_UNASSIGNED_TENANT_PASSWORD
  setup.skip(!email || !password, 'TEST_UNASSIGNED_TENANT_EMAIL/PASSWORD not set — X-05 will skip.')
  await login(page, email!, password!, '/portal')
  await page.context().storageState({ path: UNASSIGNED_TENANT_STORAGE_STATE })
})
