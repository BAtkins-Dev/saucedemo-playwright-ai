# Project

Everything the agents and skills need about *your* project, they read from here.

Filled in by the **`onboard`** skill on 2026-10-09. Edit by hand as the project changes.

## App
- **Base URL:** `https://www.saucedemo.com` — Sauce Labs' public demo shop ("Swag Labs").
  There is no local or staging environment; tests run against the live public site.
- **Auth for tests:** every spec starts signed in from a saved `storageState`, **except
  `tests/login.spec.ts` and `tests/seed.spec.ts`**, which start signed out and log in
  through the form at `/` because login is what they exercise.
  - **All new specs must start from the saved `storageState`.** The two exceptions above
    are the only ones; a new spec does not log in through the form, and `plan-tests` /
    `generate-tests` should plan and generate it that way without being asked.
  - A spec opts in at the top with `test.use({ storageState: STANDARD_USER_STATE })`
    (exported from `tests/fixtures/index.ts`) and opens its starting page directly, e.g.
    `inventoryPage.open()`. It never types credentials. `tests/cart.spec.ts` is the
    example to copy.
  - The state is not set globally in `playwright.config.ts`, so a new spec that forgets
    the `test.use` line starts signed out and is bounced to the login page.
  - `tests/auth.setup.ts` records the state to `auth/standard-user.json` (gitignored) by
    signing in once through `LoginPage.signIn()`. It runs as the `setup` project at the
    start of every run, because saucedemo's session cookie only lasts 10 minutes.
  - The account is the site's own published test account, `standard_user` /
    `secret_sauce` (listed on the login page itself, so it is not a secret). The site
    also publishes `locked_out_user`, `problem_user`, `performance_glitch_user`,
    `error_user` and `visual_user`, all with the same password; only `standard_user` has
    a saved state.
- **Test ids:** the app tags elements with `data-test`, and `playwright.config.ts` sets
  `testIdAttribute: 'data-test'`, so `getByTestId('title')` matches `data-test="title"`.
- **Test data:** there is no backend to seed. Cart state lives in the browser, so each
  test starts clean in its own context.

> `baseURL` is also set in `playwright.config.ts` so relative `page.goto('/path')`
> calls (like the seed's) resolve.

## Test command
- **Run all:** `npx playwright test`
- **Run one file:** `npx playwright test tests/<feature>.spec.ts`
- **Run one browser:** `npx playwright test --project=chromium`
- **Run a tag:** `npx playwright test --grep @smoke`
- **Headed / UI mode:** `npx playwright test --ui`
- **Open a failure trace:** `npx playwright show-trace`
- **Record a flow / find locators:** `npx playwright codegen https://www.saucedemo.com`

## Where things live
- **Plans (human-readable):** `specs/`
- **Tests:** `tests/`
- **Fixtures / page objects:** `tests/fixtures/`, `tests/pages/`

## Tickets
- **Source:** `paste` — no tracker integration. Drop the acceptance criteria into the
  prompt, or give `plan-tests` a URL to explore.

## CI
- None. This is not a git repo and no CI is wired up.
