/**
 * auth.setup.ts — signs in once as standard_user and saves the browser state, so specs
 * that are not about login (e.g. cart.spec.ts) can start signed in without typing
 * credentials. Runs as the `setup` project, which every browser project depends on
 * (see playwright.config.ts).
 */
import { test as setup, expect, STANDARD_USER_STATE } from './fixtures';

// saucedemo's own published test account (listed on its login page) — not a real credential.
const USER = { username: 'standard_user', password: 'secret_sauce' };

setup('saves the signed-in state for standard_user', async ({ loginPage, page }) => {
  await loginPage.open();
  await loginPage.signIn(USER.username, USER.password);

  // Wait for the sign-in to land before saving, or the session cookie is not there yet.
  await expect(page).toHaveURL('/inventory.html');
  await page.context().storageState({ path: STANDARD_USER_STATE });
});
