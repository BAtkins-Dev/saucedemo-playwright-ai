import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One local retry: runs against the live public site flake intermittently, mostly on
  // Firefox (see PROCESS.md, 2026-10-13 — Checkout). A retried pass is reported as flaky.
  retries: process.env.CI ? 2 : 1,
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on-first-retry',
    // saucedemo tags its elements with data-test, so getByTestId() resolves against it.
    testIdAttribute: 'data-test',
  },
  projects: [
    // Signs in once per run and saves the state to auth/ (see tests/auth.setup.ts).
    { name: 'setup', testMatch: /.*\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },
  ],
});
