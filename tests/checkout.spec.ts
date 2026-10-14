/**
 * checkout.spec.ts — generated from specs/checkout.md. Covers the checkout process from
 * the cart's Checkout button, through the information and overview pages, to the order
 * confirmation, plus the Continue and Cancel buttons along the way. Adding items is a
 * setup step here (tests/cart.spec.ts verifies it), and information-page field
 * validation is out of scope.
 */
import { test, expect, STANDARD_USER_STATE } from './fixtures';
import type { InventoryPage } from './pages/inventory.page';
import type { CartPage } from './pages/cart.page';

// Every test starts signed in as standard_user from the state saved by auth.setup.ts.
test.use({ storageState: STANDARD_USER_STATE });

const BACKPACK = { name: 'Sauce Labs Backpack', price: '$29.99' };
const BIKE_LIGHT = { name: 'Sauce Labs Bike Light', price: '$9.99' };
const BUYER = { firstName: 'Ada', lastName: 'Lovelace', postalCode: '12345' };

// Setup shared by every test with items: add them, open the cart, click Checkout.
// Lands on the information page; the test asserts from there.
async function startCheckout(inventoryPage: InventoryPage, cartPage: CartPage, ...items: string[]) {
  for (const name of items) {
    await inventoryPage.addToCart(name);
  }
  await inventoryPage.openCart();
  await cartPage.checkout();
}

// .open() lives in the spec, not the fixture, so navigation stays visible here.
test.beforeEach(async ({ inventoryPage }) => {
  await inventoryPage.open();
});

test.describe('Checkout — completing an order', () => {
  test('completes an order for a single item @smoke', async ({
    inventoryPage,
    cartPage,
    checkoutInformationPage,
    checkoutOverviewPage,
    checkoutCompletePage,
    page,
  }) => {
    await startCheckout(inventoryPage, cartPage, BACKPACK.name);
    await checkoutInformationPage.continueWith(BUYER);
    await checkoutOverviewPage.finish();

    await expect(page).toHaveURL('/checkout-complete.html');
    await expect(checkoutCompletePage.title).toHaveText('Checkout: Complete!');
    await expect(checkoutCompletePage.thankYou).toBeVisible();
    await expect(checkoutCompletePage.cartBadge).toBeHidden();
  });

  test('completes an order for several items and shows them on the overview @regression', async ({
    inventoryPage,
    cartPage,
    checkoutInformationPage,
    checkoutOverviewPage,
    checkoutCompletePage,
    page,
  }) => {
    await test.step('Check out with two items', async () => {
      await startCheckout(inventoryPage, cartPage, BACKPACK.name, BIKE_LIGHT.name);
      await checkoutInformationPage.continueWith(BUYER);

      await expect(page).toHaveURL('/checkout-step-two.html');
      await expect(checkoutOverviewPage.title).toHaveText('Checkout: Overview');
      await expect(checkoutOverviewPage.items).toHaveCount(2);
      // Soft, so one wrong price does not hide the other row's result.
      for (const item of [BACKPACK, BIKE_LIGHT]) {
        await expect.soft(checkoutOverviewPage.priceOf(item.name)).toHaveText(item.price);
      }
      await expect(checkoutOverviewPage.itemTotal).toHaveText('Item total: $39.98');
      await expect(checkoutOverviewPage.total).toHaveText('Total: $43.18');
    });

    await test.step('Finish the order', async () => {
      await checkoutOverviewPage.finish();

      await expect(page).toHaveURL('/checkout-complete.html');
      await expect(checkoutCompletePage.thankYou).toBeVisible();
      await expect(checkoutCompletePage.cartBadge).toBeHidden();
    });
  });
});

test.describe('Checkout — Continue and Cancel buttons', () => {
  test('continues from the information page to the overview @regression', async ({
    inventoryPage,
    cartPage,
    checkoutInformationPage,
    checkoutOverviewPage,
    page,
  }) => {
    await startCheckout(inventoryPage, cartPage, BACKPACK.name);
    await checkoutInformationPage.continueWith(BUYER);

    await expect(page).toHaveURL('/checkout-step-two.html');
    await expect(checkoutOverviewPage.title).toHaveText('Checkout: Overview');
    await expect(checkoutOverviewPage.item(BACKPACK.name)).toBeVisible();
  });

  test('cancels from the information page back to the cart @regression', async ({
    inventoryPage,
    cartPage,
    checkoutInformationPage,
    page,
  }) => {
    await startCheckout(inventoryPage, cartPage, BACKPACK.name);
    await expect(page).toHaveURL('/checkout-step-one.html');

    await checkoutInformationPage.cancel();

    await expect(page).toHaveURL('/cart.html');
    await expect(cartPage.item(BACKPACK.name)).toBeVisible();
    await expect(cartPage.cartBadge).toHaveText('1');
  });

  test('cancels from the overview back to the inventory page @regression', async ({
    inventoryPage,
    cartPage,
    checkoutInformationPage,
    checkoutOverviewPage,
    page,
  }) => {
    await startCheckout(inventoryPage, cartPage, BACKPACK.name);
    await checkoutInformationPage.continueWith(BUYER);
    await expect(page).toHaveURL('/checkout-step-two.html');

    await checkoutOverviewPage.cancel();

    await expect(page).toHaveURL('/inventory.html');
    // No order was placed, so the item is still in the cart.
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });
});

test.describe('Checkout — empty cart', () => {
  // KNOWN FAILURE: saucedemo leaves Checkout enabled for an empty cart and lets a $0 order
  // through to the confirmation page. Marked test.fail so the run stays green while the
  // flaw exists; if the site fixes it this reports as unexpectedly passing — remove the
  // annotation then. A disabled button is our assumed intent, not a stated requirement.
  // Note: test.fail is green on ANY failure, so this cannot detect a broken locator —
  // check the report shows the failure on toBeDisabled, not on an earlier line.
  test.fail('disables Checkout for an empty cart @regression', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.openCart();
    await expect(cartPage.items).toHaveCount(0);

    await expect(cartPage.checkoutButton).toBeDisabled();
  });
});
