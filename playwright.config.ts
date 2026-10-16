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
    // Browser projects run the UI specs only; tests/api/ runs once in the api project below.
    { name: 'chromium', testIgnore: /api[\\/]/, use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'firefox', testIgnore: /api[\\/]/, use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
    { name: 'webkit', testIgnore: /api[\\/]/, use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },
    // Request-only: no device, no setup dependency. API specs use the `request` fixture, so
    // they never launch a browser or need the saucedemo sign-in. baseURL points at reqres.
    // No retries: reqres caps anonymous use at 40 requests/day per IP, and a retry would
    // spend more of that on a failure (often the 429 itself) instead of reporting it.
    {
      name: 'api',
      testMatch: /api[\\/].*\.spec\.ts/,
      retries: 0,
      use: { baseURL: 'https://reqres.in' },
    },
  ],
});
