import { type Page, type Locator } from '@playwright/test';

/**
 * CheckoutCompletePage — thin page object for the order confirmation ("Checkout:
 * Complete!"), at tests/pages/checkout-complete.page.ts. Named locators only; NO
 * assertions live here — the spec owns every expect().
 *
 * Reached from the overview page's Finish button, so it is its own page object — see
 * page-objects.md's "one page object per page" rule.
 *
 * `.open()` only works when already signed in.
 */
export class CheckoutCompletePage {
  readonly title: Locator;
  readonly thankYou: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    // The title is a plain <span> with no heading role, so it is anchored on data-test.
    this.title = page.getByTestId('title');
    // The copy is loosened to its stable core — see assertions.md.
    this.thankYou = page.getByRole('heading', { name: /thank you for your order/i });
    // The badge is a bare number inside the header's cart link, with no role of its own.
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async open() {
    // Not 'load' — see InventoryPage.open().
    await this.page.goto('/checkout-complete.html', { waitUntil: 'domcontentloaded' });
  }
}
