import { type Page, type Locator } from '@playwright/test';

/**
 * CartPage — thin page object for the "Your Cart" page, at tests/pages/cart.page.ts.
 * Named locators + intent methods; NO assertions live here — the spec owns every
 * expect().
 *
 * Reached from the inventory page's cart link, so it is its own page object rather than
 * fields on InventoryPage — see page-objects.md's "one page object per page" rule.
 * checkout() only starts the flow; the pages it leads to have their own page objects.
 *
 * `.open()` only works when already signed in.
 */
export class CartPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly cartBadge: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    // The title is a plain <span> with no heading role, so it is anchored on data-test.
    this.title = page.getByTestId('title');
    // Cart rows have no role, so they are anchored on data-test.
    this.items = page.getByTestId('inventory-item');
    // The badge is a bare number inside the header's cart link, with no role of its own.
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async open() {
    // Not 'load' — see InventoryPage.open().
    await this.page.goto('/cart.html', { waitUntil: 'domcontentloaded' });
  }

  // Every row has the same "Remove" button, so scope to the row by its product name.
  item(name: string) {
    return this.items.filter({
      has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
    });
  }

  quantityOf(name: string) {
    return this.item(name).getByTestId('item-quantity');
  }

  priceOf(name: string) {
    return this.item(name).getByTestId('inventory-item-price');
  }

  async remove(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
