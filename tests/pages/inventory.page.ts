import { type Page, type Locator } from '@playwright/test';

/**
 * InventoryPage — thin page object for the Products page a user lands on after a
 * successful login, at tests/pages/inventory.page.ts. Named locators + intent methods;
 * NO assertions live here — the spec owns every expect().
 *
 * This is a SEPARATE page object from LoginPage on purpose: the login flow ends here,
 * but this is a different page with its own elements (the title, the menu's Logout
 * control). Folding them into LoginPage is the mistake this file exists to prevent — see
 * page-objects.md's "one page object per page" rule, including pages reached mid-flow.
 *
 * `.open()` only works when already signed in — saucedemo bounces an anonymous visitor
 * back to the login page. The seed reaches this page via LoginPage.signIn() instead;
 * cart.spec.ts arrives signed in from a saved storageState.
 */
export class InventoryPage {
  readonly title: Locator;
  readonly menu: Locator;
  readonly logout: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly sortSelect: Locator;
  readonly activeSort: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;

  constructor(private readonly page: Page) {
    // The title is a plain <span> with no heading role, so it is anchored on data-test.
    this.title = page.getByTestId('title');
    this.menu = page.getByRole('button', { name: 'Open Menu' });
    this.logout = page.getByRole('button', { name: 'Logout' });
    // The name carries the count ("Cart, empty" / "Cart, 2 items"), so match its stable start.
    this.cartLink = page.getByRole('button', { name: /^Cart,/ });
    // The badge is a bare number inside the cart link, with no role of its own.
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.sortSelect = page.getByRole('combobox', { name: 'Sort products' });
    // The label a user sees is a separate <span> laid over the <select>, with no role.
    this.activeSort = page.getByTestId('active-option');
    // Every product's name and price, in display order. No list roles, so data-test.
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
  }

  async open() {
    // Not 'load': saucedemo answers deep links with a 404 and reloads the app, and a
    // stalled product image or web font can hold 'load' past the test timeout. The
    // spec's web-first assertions wait for the elements they actually need.
    await this.page.goto('/inventory.html', { waitUntil: 'domcontentloaded' });
  }

  // Every product has the same "Add to cart" / "Remove" button, so scope to the product
  // by its name. The product card has no role, so it is anchored on data-test.
  item(name: string) {
    return this.page
      .getByTestId('inventory-item')
      .filter({ has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }) });
  }

  addButton(name: string) {
    return this.item(name).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(name: string) {
    return this.item(name).getByRole('button', { name: 'Remove' });
  }

  async addToCart(name: string) {
    await this.addButton(name).click();
  }

  async removeFromCart(name: string) {
    await this.removeButton(name).click();
  }

  // Takes the option's visible label, e.g. 'Price (low to high)'.
  async sortBy(label: string) {
    await this.sortSelect.selectOption({ label });
  }

  async openCart() {
    await this.cartLink.click();
  }

  async signOut() {
    await this.menu.click();
    await this.logout.click();
  }
}
