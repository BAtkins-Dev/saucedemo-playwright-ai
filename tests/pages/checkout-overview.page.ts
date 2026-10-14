import { type Page, type Locator } from '@playwright/test';

/**
 * CheckoutOverviewPage — thin page object for "Checkout: Overview", at
 * tests/pages/checkout-overview.page.ts. Named locators + intent methods; NO assertions
 * live here — the spec owns every expect().
 *
 * Reached from the information page's Continue button, so it is its own page object —
 * see page-objects.md's "one page object per page" rule.
 *
 * `.open()` only works when already signed in.
 */
export class CheckoutOverviewPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly itemTotal: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    // The title is a plain <span> with no heading role, so it is anchored on data-test.
    this.title = page.getByTestId('title');
    // Order rows have no role, so they are anchored on data-test.
    this.items = page.getByTestId('inventory-item');
    // The price summary lines are plain <div>s with no role, so they are anchored on data-test.
    this.itemTotal = page.getByTestId('subtotal-label');
    this.total = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  async open() {
    // Not 'load' — see InventoryPage.open().
    await this.page.goto('/checkout-step-two.html', { waitUntil: 'domcontentloaded' });
  }

  // Scope to the row by its product name, as on the cart page.
  item(name: string) {
    return this.items.filter({
      has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
    });
  }

  priceOf(name: string) {
    return this.item(name).getByTestId('inventory-item-price');
  }

  async finish() {
    await this.finishButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
