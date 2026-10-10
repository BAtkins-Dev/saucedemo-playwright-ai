/**
 * cart.spec.ts — generated from specs/cart.md. Covers adding items from the inventory
 * page, the cart badge count, and the cart page (contents, removing items). Checkout is
 * out of scope: the Checkout button is never clicked.
 */
import { test, expect, STANDARD_USER_STATE } from './fixtures';

// Every test starts signed in as standard_user from the state saved by auth.setup.ts.
test.use({ storageState: STANDARD_USER_STATE });

const BACKPACK = { name: 'Sauce Labs Backpack', price: '$29.99' };
const BIKE_LIGHT = { name: 'Sauce Labs Bike Light', price: '$9.99' };

// .open() lives in the spec, not the fixture, so navigation stays visible here.
test.beforeEach(async ({ inventoryPage }) => {
  await inventoryPage.open();
});

test.describe('Cart — adding items', () => {
  test('adds an item to the cart from the inventory page @smoke', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(BACKPACK.name);

    await expect(inventoryPage.cartBadge).toHaveText('1');
    await expect(inventoryPage.removeButton(BACKPACK.name)).toBeVisible();
  });

  test('counts each added item on the cart badge @regression', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(BACKPACK.name);
    await inventoryPage.addToCart(BIKE_LIGHT.name);

    await expect(inventoryPage.cartBadge).toHaveText('2');
  });

  test('removes an item from the inventory page @regression', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(BACKPACK.name);
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await inventoryPage.removeFromCart(BACKPACK.name);

    await expect(inventoryPage.cartBadge).toBeHidden();
    await expect(inventoryPage.addButton(BACKPACK.name)).toBeVisible();
  });
});

test.describe('Cart — cart contents', () => {
  test('shows the added items in the cart @smoke', async ({ inventoryPage, cartPage, page }) => {
    await inventoryPage.addToCart(BACKPACK.name);
    await inventoryPage.addToCart(BIKE_LIGHT.name);
    await inventoryPage.openCart();

    await expect(page).toHaveURL('/cart.html');
    await expect(cartPage.title).toHaveText('Your Cart');
    await expect(cartPage.items).toHaveCount(2);
    // Soft, so one wrong price or quantity does not hide the other rows' results.
    for (const item of [BACKPACK, BIKE_LIGHT]) {
      await expect.soft(cartPage.priceOf(item.name)).toHaveText(item.price);
      await expect.soft(cartPage.quantityOf(item.name)).toHaveText('1');
    }
  });

  test('removes an item from the cart page @regression', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(BACKPACK.name);
    await inventoryPage.addToCart(BIKE_LIGHT.name);
    await inventoryPage.openCart();
    await cartPage.remove(BACKPACK.name);

    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.item(BIKE_LIGHT.name)).toBeVisible();
    await expect(cartPage.cartBadge).toHaveText('1');
  });

  test('empties the cart when the last item is removed @regression', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(BACKPACK.name);
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await inventoryPage.openCart();
    await cartPage.remove(BACKPACK.name);

    await expect(cartPage.items).toHaveCount(0);
    await expect(cartPage.cartBadge).toBeHidden();
  });
});
