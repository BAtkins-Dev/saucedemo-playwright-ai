/**
 * logout.spec.ts — generated from specs/logout.md. Covers signing out through the side
 * menu: the login page shows afterwards, and the session is really gone. Login itself is
 * covered by login.spec.ts.
 */
import { test, expect, STANDARD_USER_STATE } from './fixtures';

// Every test starts signed in as standard_user from the state saved by auth.setup.ts.
test.use({ storageState: STANDARD_USER_STATE });

// .open() lives in the spec, not the fixture, so navigation stays visible here.
test.beforeEach(async ({ inventoryPage }) => {
  await inventoryPage.open();
});

test.describe('Logout', () => {
  test('shows the login page after logging out @smoke', async ({ inventoryPage, loginPage, page }) => {
    await inventoryPage.signOut();

    await expect(page).toHaveURL('/');
    await expect(loginPage.username).toBeVisible();
    await expect(loginPage.password).toBeVisible();
    await expect(loginPage.submit).toBeVisible();
    // Guards against logout landing on the login page with an error; true before logout too.
    await expect(loginPage.error).toBeHidden();
  });

  test('ends the session, so a signed-in page is no longer reachable @regression', async ({
    inventoryPage,
    loginPage,
    page,
  }) => {
    await inventoryPage.signOut();
    await expect(loginPage.submit).toBeVisible();

    // Deliberately visit a signed-in page while signed out; saucedemo should bounce it.
    await inventoryPage.open();

    await expect(page).toHaveURL('/');
    // Anchored on the banner's role="alert"; the copy is loosened to its stable core.
    await expect(loginPage.error).toContainText(/only access '\/inventory\.html' when you are logged in/i);
  });
});
