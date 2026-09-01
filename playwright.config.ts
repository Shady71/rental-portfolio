import { defineConfig, devices } from '@playwright/test'

try {
  process.loadEnvFile('.env.test')
} catch {
  // .env.test not present yet — fine as long as the setup project isn't run.
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1, // tests mutate shared, real seeded accounts — serialize to avoid races
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000, // next dev's cold compiles can be slow on first visit to a route
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'e2e',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
})
