import { type Page, type Locator } from '@playwright/test';

/**
 * CheckoutInformationPage — thin page object for "Checkout: Your Information", at
 * tests/pages/checkout-information.page.ts. Named locators + intent methods; NO
 * assertions live here — the spec owns every expect().
 *
 * Reached from the cart page's Checkout button, so it is its own page object rather than
 * fields on CartPage — see page-objects.md's "one page object per page" rule.
 *
 * `.open()` only works when already signed in.
 */
export class CheckoutInformationPage {
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    // The title is a plain <span> with no heading role, so it is anchored on data-test.
    this.title = page.getByTestId('title');
    // The inputs have no <label>, only a placeholder — see locators.md.
    this.firstName = page.getByPlaceholder('First Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.postalCode = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  async open() {
    // Not 'load' — see InventoryPage.open().
    await this.page.goto('/checkout-step-one.html', { waitUntil: 'domcontentloaded' });
  }

  async continueWith(buyer: { firstName: string; lastName: string; postalCode: string }) {
    await this.firstName.fill(buyer.firstName);
    await this.lastName.fill(buyer.lastName);
    await this.postalCode.fill(buyer.postalCode);
    await this.continueButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
