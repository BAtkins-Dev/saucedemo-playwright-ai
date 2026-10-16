/**
 * customerCheckoutValidation.spec.ts — generated from specs/customerCheckoutValidation.md.
 * Covers the First Name, Last Name and Zip/Postal Code fields on "Checkout: Your
 * Information", driven by tests/data/checkoutValidation.json. Each test stops after
 * clicking Continue; login, the cart and the rest of checkout are covered elsewhere.
 */
import { test, expect, STANDARD_USER_STATE } from './fixtures';
import validation from './data/checkoutValidation.json';

// Every test starts signed in as standard_user from the state saved by auth.setup.ts.
test.use({ storageState: STANDARD_USER_STATE });

// .open() lives in the spec, not the fixture, so navigation stays visible here. A
// signed-in user can open the information page directly, even with an empty cart.
test.beforeEach(async ({ checkoutInformationPage }) => {
  await checkoutInformationPage.open();
});

test.describe('Customer checkout validation — accepted', () => {
  for (const row of validation.accepted) {
    test(row.title, async ({ checkoutInformationPage, checkoutOverviewPage, page }) => {
      await checkoutInformationPage.continueWith(row);

      await expect(page).toHaveURL('/checkout-step-two.html');
      await expect(checkoutOverviewPage.title).toHaveText('Checkout: Overview');
    });
  }
});

test.describe('Customer checkout validation — rejected', () => {
  for (const row of validation.rejected) {
    test(row.title, async ({ checkoutInformationPage, page }) => {
      // KNOWN FAILURE rows (see the JSON's knownFailure reason) stay green while the defect
      // exists and report as unexpectedly passing once it is fixed — remove the field then.
      // test.fail is green on ANY failure, so check the report shows the failure on the
      // banner or URL check below, not on an earlier line.
      test.fail(!!row.knownFailure, row.knownFailure);

      await checkoutInformationPage.continueWith(row);

      // Anchored on the banner's role="alert"; the copy is matched without its "Error: " prefix.
      await expect(checkoutInformationPage.error).toContainText(row.error);
      // True before Continue too; after the banner check it proves the form did not move on.
      await expect(page).toHaveURL('/checkout-step-one.html');
    });
  }
});
