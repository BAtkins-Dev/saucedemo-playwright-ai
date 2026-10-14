import { type Page, type Locator } from '@playwright/test';

/**
 * LoginPage — thin page object for the seed's representative flow, at
 * tests/pages/login.page.ts. It holds named locators and intent methods (the method
 * name IS the step); NO assertions live here — the spec owns every expect().
 *
 * `.open()` navigates but is NOT auto-called: the fixture only constructs this object,
 * and the spec calls `.open()` explicitly (see fixtures/index.ts + test-structure.md).
 *
 * Scoped to the login page only — elements that appear AFTER a successful login (the
 * Products title, the menu's Logout control) belong to that page's own page object
 * (see tests/pages/inventory.page.ts), not here. See page-objects.md's "one page
 * object per page" rule, including pages reached mid-flow.
 */
export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    // The inputs have no <label>, only a placeholder — see locators.md.
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.submit = page.getByRole('button', { name: 'Login' });
    // Error banner anchored on its role="alert", not its copy — see assertions.md.
    this.error = page.getByRole('alert');
  }

  async open() {
    // Not 'load': a stalled web font can hold 'load' past the test timeout, and the
    // spec's web-first assertions wait for the elements they actually need.
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async signIn(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
