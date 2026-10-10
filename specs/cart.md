# Cart — test plan
Source: pasted brief (scope only) + explored https://www.saucedemo.com/inventory.html and
`/cart.html` on 2026-10-09

> **Input quality:** the brief sets the scope but gives no acceptance criteria, so the
> expected outcomes below come from the live site. They record what the cart does today,
> not what it is meant to do — confirm before trusting these as tests.

Scope: adding items to the cart from the inventory page, the cart badge count, and the
cart page (contents, removing items). The Checkout button is never clicked and nothing
past the cart page is covered — that is a separate round. Login is not re-tested.

## Preconditions
- Auth: every scenario starts already signed in as `standard_user` from the saved
  `storageState`, per the project rule in `PROJECT.md`, and opens the inventory page
  directly. The state is recorded once per run by `tests/auth.setup.ts`; no cart test
  types credentials.
- Data: none to seed. The cart lives in the browser, so each test starts with an empty
  cart in its own context. Items used: Sauce Labs Backpack ($29.99) and Sauce Labs Bike
  Light ($9.99).

## Scenarios

### Inventory page

#### Adds an item to the cart from the inventory page @smoke
1. Click "Add to cart" on Sauce Labs Backpack.

**Expected:** the cart badge shows 1, and the Backpack's button now reads "Remove".

#### Counts each added item on the cart badge @regression
1. Click "Add to cart" on Sauce Labs Backpack.
2. Click "Add to cart" on Sauce Labs Bike Light.

**Expected:** the cart badge shows 2.

#### Removes an item from the inventory page @regression
1. Click "Add to cart" on Sauce Labs Backpack.
2. Click "Remove" on Sauce Labs Backpack.

**Expected:** the cart badge is gone (the cart shows no count), and the Backpack's button
reads "Add to cart" again.

### Cart page

#### Shows the added items in the cart @smoke
1. Add Sauce Labs Backpack and Sauce Labs Bike Light from the inventory page.
2. Open the cart from the header.

**Expected:** the page is `/cart.html` with the title "Your Cart". It lists exactly two
items: Sauce Labs Backpack at $29.99 and Sauce Labs Bike Light at $9.99, each with
quantity 1.

#### Removes an item from the cart page @regression
1. Add Sauce Labs Backpack and Sauce Labs Bike Light from the inventory page.
2. Open the cart.
3. Click "Remove" on Sauce Labs Backpack.

**Expected:** the cart lists only Sauce Labs Bike Light, and the cart badge shows 1.

#### Empties the cart when the last item is removed @regression
1. Add Sauce Labs Backpack from the inventory page.
2. Open the cart.
3. Click "Remove" on Sauce Labs Backpack.

**Expected:** the cart lists no items, and the cart badge is gone.

Notes for the generator:
- `InventoryPage` needs per-item add and remove actions and the header cart link and
  badge. The cart page is a new page and gets its own page object
  (`tests/pages/cart.page.ts`) and fixture — do not add cart-page fields to
  `InventoryPage`.
- The header cart button has the accessible name "Cart, empty" / "Cart, 1 items" /
  "Cart, 2 items", and the badge is a child holding the bare number.
- Item buttons on the inventory page all share the name "Add to cart" or "Remove", so
  scope them to the item, not by index.

## Out of scope / open questions
- **Checkout** — by decision. The Checkout button was not clicked. It is present on the
  cart page even when the cart is empty; whether that is intended is unknown.
- **Login** — covered by `tests/login.spec.ts`.
- **Saved login state lifetime.** saucedemo's session cookie lasts 10 minutes (checked
  2026-10-09). The state is re-recorded at the start of every run, so cart tests would
  only fail on this if a run takes longer than 10 minutes; the full suite currently
  takes under a minute.
- Observed, deliberately not scenarios:
  - "Continue Shopping" on the cart page returns to the inventory page, and an item
    removed in the cart shows "Add to cart" there again.
  - The cart page also shows each item's description.
  - The cart badge wording is "1 items" for a single item.
- Not explored:
  - Adding or removing from an item's detail page.
  - Whether the cart survives a page reload or logging out and back in.
  - The menu's "Reset App State".
  - The other four products, and adding all six.
  - The other published accounts (`problem_user` and the rest).
- The browser console showed errors during the session. They were not investigated and
  had no visible effect on the cart.
