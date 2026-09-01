import { test as base, expect, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'
import {
  LANDLORD_STORAGE_STATE,
  TENANT_STORAGE_STATE,
  EMPTY_LANDLORD_STORAGE_STATE,
  UNASSIGNED_TENANT_STORAGE_STATE,
} from './auth-paths'

type Fixtures = {
  landlordPage: Page
  tenantPage: Page
  emptyLandlordPage: Page
  unassignedTenantPage: Page
}

export const test = base.extend<Fixtures>({
  landlordPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: LANDLORD_STORAGE_STATE })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
  tenantPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: TENANT_STORAGE_STATE })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
  emptyLandlordPage: async ({ browser }, use, testInfo) => {
    testInfo.skip(
      !existsSync(EMPTY_LANDLORD_STORAGE_STATE),
      'TEST_EMPTY_LANDLORD_EMAIL/PASSWORD not set — see tests/README.md.'
    )
    const context = await browser.newContext({ storageState: EMPTY_LANDLORD_STORAGE_STATE })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
  unassignedTenantPage: async ({ browser }, use, testInfo) => {
    testInfo.skip(
      !existsSync(UNASSIGNED_TENANT_STORAGE_STATE),
      'TEST_UNASSIGNED_TENANT_EMAIL/PASSWORD not set — see tests/README.md.'
    )
    const context = await browser.newContext({ storageState: UNASSIGNED_TENANT_STORAGE_STATE })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect }
