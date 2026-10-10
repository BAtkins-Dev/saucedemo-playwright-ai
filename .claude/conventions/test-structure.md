# Test structure — fixtures, independence, tagging, layout

How a spec is shaped, so that any test can run alone, in any order, on any worker.

## Independence (non-negotiable)

Every `test` stands on its own.

- **No shared mutable state between tests.** No "test A creates the record test B
  edits." If B needs a record, B creates it (via API/fixture) in its own setup.
- **Order-independent.** Tests must pass when run alone, in parallel, and shuffled.
  Don't rely on file order or on `test.describe.serial` unless a flow genuinely
  cannot be decomposed — and if you use it, leave a comment saying why.
- **Self-cleaning.** A test that creates data tears it down (fixture teardown or an
  afterEach), so reruns start clean.

## Scope — your app, not third parties

Test behaviour your app owns. Don't drive a third party you can't control (a hosted
payment page, an OAuth provider's login UI, an email inbox) — stub or mock at the
boundary, or assert the handoff and stop. A vendor changing their UI shouldn't fail
your suite.

## Fixtures hand over the instance — `.open()` stays in the spec

The default fixture exposes **one page object per page, instantiate-only**: it constructs
the object and hands it to the test, and does **nothing else**. Navigation is *not* in the
fixture — the spec calls `.open()` itself (in `beforeEach` or the test), so where a test
starts is visible at test-case altitude instead of hidden in setup.

- **One fixture per page object.** Put them in `tests/fixtures/` and import `test`/`expect`
  from there (not from `@playwright/test`).
- **Lazy by construction.** Only the page(s) a test destructures are built, so an unused
  page object never navigates.
- **No `.open()`, no assertions, no clicking through setup in the fixture body** — just
  `new SomePage(page)`. Navigation belongs in the spec.

```ts
// tests/fixtures/index.ts — construct only; the spec navigates
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

type Fixtures = { loginPage: LoginPage };

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page)); // no .open() here
  },
});
export { expect };
```

```ts
// in the spec — .open() is explicit
test.beforeEach(async ({ loginPage }) => {
  await loginPage.open();
});
```

**Auth and data still belong in fixtures**, just the same instantiate-only way. For auth,
build a context from a saved `storageState` (logged in once, out of band) and hand the
test a ready page object — don't pay UI-login cost per test, and don't bury the login
clicks in a fixture. For data, seed records through the API in a fixture and hand the test
what it needs; faster and less flaky than clicking through setup screens.

## Test body — action → verify, every `expect()` in the spec

A test reads top-to-bottom as **action, then verify**: call the page object's intent
method, then assert the outcome with `expect`. Don't interleave incidental assertions
between every click; do the user action, then check what the user would see.

- **Every `expect()` lives in the spec, never in a page object** (see `page-objects.md`).
  The page object *does*; the spec *verifies*. Reading the spec alone tells you what's
  guaranteed.
- **`test.step` labels high-level phases only** — a named phase of a longer flow (`'Sign
  in'`, `'Submit the order'`), not a wrapper around every line. A short single-phase test
  needs no steps at all. Use a step when it makes a multi-phase test scan as a story;
  skip it when it would just add nesting.

```ts
test('logs back out from the dashboard', async ({ loginPage }) => {
  await test.step('Sign in', async () => {
    await loginPage.signIn(USER.email, USER.password);
    await expect(loginPage.logout).toBeVisible();
  });
  await test.step('Sign out', async () => {
    await loginPage.logout.click();
    await expect(loginPage.submit).toBeVisible();
  });
});
```

## Tagging

Tag tests so suites can be sliced (see `PROJECT.md` for the grep commands).

- `@smoke` — fast, critical-path, runs on every PR.
- `@regression` — broader coverage, runs nightly / pre-release.
- Tag in the title: `test('checkout with saved card @smoke', ...)`.
- A `@smoke` test should be fast and deterministic. If it isn't, it's not smoke.

## Layout & naming

```
specs/                      ← human-readable plans (planner output)
  checkout.md
tests/
  checkout.spec.ts          ← one feature per file
  fixtures/                 ← shared test fixtures (instantiate-only page objects)
  pages/                    ← one thin page object per page — see page-objects.md
```

- **One feature per spec file**, named for the feature: `checkout.spec.ts`.
- **`describe` blocks group by sub-feature or scenario**, not by page.
- **Test titles state behaviour, present tense:** `'applies a percentage coupon'`,
  not `'test coupon'` or `'should apply coupon'`.
- Keep a test short enough to read as a single user story. If it needs section
  comments to follow, it's probably two tests.
