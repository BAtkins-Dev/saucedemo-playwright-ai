/**
 * login.spec.ts — generated from specs/login.md. Covers the login form only; the
 * positive scenario ends as soon as the inventory page is reached.
 */
import { test, expect } from './fixtures';

// saucedemo's own published test accounts (listed on its login page) — not real credentials.
const PASSWORD = 'secret_sauce';
const USER = { username: 'standard_user', password: PASSWORD };

// One row per negative scenario in specs/login.md: same steps and assertion shape,
// different inputs. Error copy is loosened to its stable core (no "Epic sadface: " prefix).
const REJECTED_LOGINS = [
  {
    title: 'rejects an invalid password',
    username: USER.username,
    password: 'wrong-password',
    error: /username and password do not match any user in this service/i,
  },
  {
    title: 'rejects an unknown username',
    username: 'not_a_user',
    password: PASSWORD,
    error: /username and password do not match any user in this service/i,
  },
  {
    title: 'rejects a locked-out user',
    username: 'locked_out_user',
    password: PASSWORD,
    error: /this user has been locked out/i,
  },
  {
    title: 'requires a username',
    username: '',
    password: PASSWORD,
    error: /username is required/i,
  },
  {
    title: 'requires a password',
    username: USER.username,
    password: '',
    error: /password is required/i,
  },
  {
    title: 'requires both fields',
    username: '',
    password: '',
    error: /username is required/i,
  },
];

// .open() lives in the spec, not the fixture, so navigation stays visible here.
test.beforeEach(async ({ loginPage }) => {
  await loginPage.open();
});

test.describe('Login', () => {
  test('logs in with valid credentials @smoke', async ({ loginPage, inventoryPage, page }) => {
    await loginPage.signIn(USER.username, USER.password);

    await expect(page).toHaveURL('/inventory.html');
    await expect(inventoryPage.title).toHaveText('Products');
  });

  for (const { title, username, password, error } of REJECTED_LOGINS) {
    test(`${title} @regression`, async ({ loginPage, page }) => {
      await loginPage.signIn(username, password);

      // Anchored on the banner's role="alert"; the copy is loosened to its stable core.
      await expect(loginPage.error).toContainText(error);
      await expect(page).toHaveURL('/');
    });
  }
});
