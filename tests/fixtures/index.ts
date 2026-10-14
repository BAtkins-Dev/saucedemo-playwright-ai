/**
 * Shared test fixtures, at tests/fixtures/index.ts. One fixture per page object,
 * INSTANTIATE-ONLY: each hands the spec a freshly constructed page-object instance and
 * nothing more — it does NOT navigate. The spec calls `.open()` itself (in beforeEach
 * or the test), so navigation stays visible at test-case altitude (see
 * test-structure.md).
 *
 * Fixtures are lazy: only the page(s) a test destructures are constructed, so nothing
 * is set up unless that test uses it. Import `test`/`expect` from here instead of from
 * '@playwright/test'. Add one block per page object as the suite grows — including
 * pages reached mid-flow (e.g. inventoryPage below, which the seed reaches via
 * loginPage.signIn() rather than loginPage itself exposing it).
 */
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutInformationPage } from '../pages/checkout-information.page';
import { CheckoutOverviewPage } from '../pages/checkout-overview.page';
import { CheckoutCompletePage } from '../pages/checkout-complete.page';

/**
 * Saved login state for standard_user, recorded by tests/auth.setup.ts at the start of
 * every run (saucedemo's session cookie only lasts 10 minutes). A spec that should start
 * signed in opts in with `test.use({ storageState: STANDARD_USER_STATE })`; it is not
 * applied globally because the login tests must start signed out.
 */
export const STANDARD_USER_STATE = 'auth/standard-user.json';

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInformationPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    // Construction only — no .open() here; the spec navigates.
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutInformationPage: async ({ page }, use) => {
    await use(new CheckoutInformationPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },
});

export { expect };
