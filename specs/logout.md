# Logout — test plan
Source: pasted criterion ("logging out — login page should display"), with details
explored on https://www.saucedemo.com on 2026-10-14

> **Input quality:** the only written requirement is one line: after logging out, the
> login page shows. The second scenario and the expected details below (URL `/`, the
> error copy) come from the live site, so they show what happens today, not what was
> intended. Confirm them before trusting these as tests.

Scope: signing out through the side menu and what the user sees afterwards. Login itself
is covered by `specs/login.md`.

## Preconditions
- Auth: every scenario starts already signed in as `standard_user` from the saved
  `storageState` (`test.use({ storageState: STANDARD_USER_STATE })`), per the project
  rule in `PROJECT.md`, and opens the inventory page directly. No logout test types
  credentials. `tests/cart.spec.ts` is the pattern to copy.
- Data: none to seed.

## Scenarios

### Shows the login page after logging out @smoke
1. Open the inventory page.
2. Open the side menu and choose "Logout".

**Expected:** the browser is on the login page (`/`). The Username and Password fields and
the Login button are visible, and no error banner is shown.

### Ends the session, so a signed-in page is no longer reachable @regression
1. Open the inventory page.
2. Open the side menu and choose "Logout".
3. Go straight to the inventory page (`/inventory.html`).

**Expected:** the user is sent back to the login page (`/`), and the error banner says
they can only reach `/inventory.html` when logged in. (Today's copy: "Epic sadface: You
can only access '/inventory.html' when you are logged in." Assert on its stable core.)

## Out of scope / open questions
- **Overlap with the seed.** `tests/seed.spec.ts` already has "logs back out from the
  inventory page", and `specs/login.md` says logout is covered there. That test signs in
  through the form and only checks that the Login button is visible. Scenario 1 here does
  the same job from `storageState`, with a stronger check. Should the seed test stay as
  the style example only, or be skipped like its other two tests once `logout.spec.ts`
  exists?
- **Interference with the saved session.** Logging out might also invalidate the shared
  `auth/standard-user.json` session for tests running in parallel. Each test gets its own
  context with copied cookies, and saucedemo's session is client-side, so this should be
  safe. Confirm with a parallel run after the spec is generated.
- **Logging out from other pages** (cart, checkout, product detail): it's the same menu
  control on every page, so it isn't planned separately. Add it if the menu is ever
  page-specific.
- **Browser Back after logout:** not explored or planned. This is an incidental check
  unless a requirement says that cached pages must not show.
- **Other menu items** (All Items, About, Reset App State): not part of logout.
