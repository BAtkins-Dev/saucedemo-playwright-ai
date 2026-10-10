# Page objects — a thin one per page, by default

For e2e specs, the default is **one thin page object per page** (or per significant,
self-contained component). It holds the page's named locators and intent methods so the
spec reads as a story of user actions, not a pile of selectors. This applies even when a
page is used by a single spec today — the page object is how we keep the spec readable
and the locators in one place, not a reward you unlock after the second reuse.

"Thin" is the whole discipline. A page object that grows assertions, branching, or
test logic stops helping; keep it to locators and the actions a user can take.

## The shape

- **One file per page**, in `tests/pages/`, named for the page:
  `login.page.ts`, `courses-table.page.ts`.
- **This includes pages reached mid-flow, not just the page a test starts on.** If an
  action navigates somewhere new — login redirecting to a dashboard, checkout
  redirecting to an order-confirmation page — the elements on *that* page belong to
  *that* page's own object. Don't bolt a post-navigation heading or logout control onto
  the page object the flow started from just because one test method (`signIn`,
  `submitOrder`) is what got you there. A giveaway you've done this: a "LoginPage" that
  has a `dashboardHeading` or `logout` field — those are the dashboard's, not login's.
- **Named locators as fields.** Assign each meaningful element to a readonly field with
  a name that says what it is (`this.error`, `this.submit`). The rules in `locators.md`
  apply here — role-first, no raw `nth`.
- **Intent methods where the method name IS the step.** `signIn(user, pass)`,
  `filterLanguage('Java')`, `addRow()`. A method *does* a user-meaningful thing; it
  doesn't make the test reach in and drive raw locators step by step.
- **`page` in the constructor**, locators built there, the object kept small.
- **`.open()` for navigation, but never auto-run.** Provide an `open()` that does the
  `goto`; the fixture only *constructs* the object and the spec calls `.open()`
  explicitly (see `test-structure.md`). Navigation stays visible in the spec.

## No assertions in the page object

A method *does* a thing; the **spec** asserts the outcome. Every `expect()` lives in the
spec, never inside a page-object method. This keeps the page object reusable across tests
that expect different outcomes, and keeps the "what we're verifying" readable at
test-case altitude.

If you find yourself wanting an `expectLoggedIn()` helper, that's a sign the assertion
belongs in the spec where the reader can see it.

```ts
// tests/pages/login.page.ts — locators + intent, no assertions
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Sign in' });
    this.error = page.locator('#error'); // anchored on #id — see assertions.md
  }

  async open() {
    await this.page.goto('/login');
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
```

```ts
// in the spec — the page object carries the actions; the test owns every assertion
test.beforeEach(async ({ loginPage }) => {
  await loginPage.open();              // navigation is explicit, here
});

test('rejects an invalid password', async ({ loginPage }) => {
  await loginPage.signIn('ada@example.com', 'wrong-password');
  await expect(loginPage.error).toHaveText('Your password is invalid!');
});
```

## Keep it thin — the failure modes

- **No assertions inside actions** (above).
- **Expose intent, not a remote control.** A method that takes ten arguments and toggles
  every control is a remote control, not intent. Prefer small named actions
  (`filterLanguage`, `uncheckLevel`) and, where it genuinely reads better, one composing
  method (`filter({ language, levels })`).
- **No test logic, no branching on environment, no waits.** Auto-retrying assertions in
  the spec do the waiting (`assertions.md`); the page object doesn't sleep or poll.
- **A field that only renames one locator with no method around it** is fine *as part of*
  the page's named-locator set — that's the point. It's not fine as a lone wrapper class
  that adds nothing else.

Rule of thumb: the page object answers "what can a user do on this page, and where are
its elements." The spec answers "what should happen." If a method starts answering the
second question, move it to the spec.
