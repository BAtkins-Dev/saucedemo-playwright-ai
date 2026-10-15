/**
 * seed.spec.ts — the canonical style example, at tests/seed.spec.ts (the path the
 * agents reference). Every generated spec imitates this file's imports, structure,
 * locators, and assertions, so keep it real and keep it green.
 *
 * The validated readable shape (see .claude/conventions/):
 *   - Thin page object PER PAGE (tests/pages/*.page.ts): named locators + intent
 *     methods where the method name IS the step; NO assertions live there. This
 *     includes pages reached mid-flow — the seed lands on a different page after
 *     signIn(), so that page gets its own object (inventory.page.ts), not fields
 *     bolted onto LoginPage. — page-objects.md
 *   - The fixture hands over a page-object INSTANCE only; navigation is NOT in the
 *     fixture. `.open()` is called HERE, explicitly, in beforeEach or the test.
 *     — test-structure.md
 *   - The body reads action → verify at test-case altitude; every expect() stays in
 *     the spec. — assertions.md
 *   - test.step wraps high-level PHASES only — a label, not every line.
 *   - Assertion targets are anchored on role / data-test, not getByText. — assertions.md
 */
import { test, expect } from './fixtures';

// saucedemo's own published test account (listed on its login page) — not a real credential.
const USER = { username: 'standard_user', password: 'secret_sauce' };

// .open() lives in the spec, not the fixture, so navigation stays visible here.
test.beforeEach(async ({ loginPage }) => {
  await loginPage.open();
});

test.describe('Seed', () => {
  // Skipped: covered by tests/login.spec.ts (specs/login.md). Kept as the style example.
  test.skip('logs in with valid credentials @smoke', async ({ loginPage, inventoryPage, page }) => {
    await loginPage.signIn(USER.username, USER.password);

    await expect(page).toHaveURL('/inventory.html');
    await expect(inventoryPage.title).toHaveText('Products');
  });

  // Skipped: covered by tests/login.spec.ts (specs/login.md). Kept as the style example.
  test.skip('rejects an invalid password @regression', async ({ loginPage }) => {
    await loginPage.signIn(USER.username, 'wrong-password');

    // Anchored on the banner's role="alert"; the copy is loosened to its stable core.
    await expect(loginPage.error).toContainText(/username and password do not match/i);
  });

  // Skipped: covered by tests/logout.spec.ts (specs/logout.md). Kept as the style example.
  test.skip('logs back out from the inventory page @regression', async ({ loginPage, inventoryPage }) => {
    await test.step('Sign in', async () => {
      await loginPage.signIn(USER.username, USER.password);
      await expect(inventoryPage.menu).toBeVisible();
    });

    await test.step('Sign out', async () => {
      await inventoryPage.signOut();
      await expect(loginPage.submit).toBeVisible();
    });
  });
});
