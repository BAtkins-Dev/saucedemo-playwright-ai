# Sorting — test plan
Source: explored https://www.saucedemo.com/inventory.html on 2026-10-14 (no ticket or
acceptance criteria)

> **Input quality:** there is no written spec for sorting, so the expected outcomes below
> come from the live site. They record what the sort does today, not what it is meant to
> do. Confirm them before trusting these as tests.

Scope: the "Sort products" dropdown on the inventory page and the order of the six
products it produces. Login is not re-tested.

## Preconditions
- Auth: every scenario starts already signed in as `standard_user` from the saved
  `storageState` (`test.use({ storageState: STANDARD_USER_STATE })`), per the project
  rule in `PROJECT.md`, and opens the inventory page directly. No sorting test types
  credentials. `tests/cart.spec.ts` is the pattern to copy.
- Data: none to seed. The site always lists the same six products:

  | Product | Price |
  |---|---|
  | Sauce Labs Backpack | $29.99 |
  | Sauce Labs Bike Light | $9.99 |
  | Sauce Labs Bolt T-Shirt | $15.99 |
  | Sauce Labs Fleece Jacket | $49.99 |
  | Sauce Labs Onesie | $7.99 |
  | Test.allTheThings() T-Shirt (Red) | $15.99 |

## Scenarios

### Lists products by name, A to Z, by default @smoke
1. Open the inventory page.

**Expected:** the sort dropdown shows "Name (A to Z)", and the products are listed in this
order: Sauce Labs Backpack, Sauce Labs Bike Light, Sauce Labs Bolt T-Shirt, Sauce Labs
Fleece Jacket, Sauce Labs Onesie, Test.allTheThings() T-Shirt (Red).

### Sorts by name, Z to A @regression
1. Open the inventory page.
2. Choose "Name (Z to A)" from the sort dropdown.

**Expected:** the dropdown shows "Name (Z to A)", and the products are listed in this
order: Test.allTheThings() T-Shirt (Red), Sauce Labs Onesie, Sauce Labs Fleece Jacket,
Sauce Labs Bolt T-Shirt, Sauce Labs Bike Light, Sauce Labs Backpack.

### Sorts by price, low to high @regression
1. Open the inventory page.
2. Choose "Price (low to high)" from the sort dropdown.

**Expected:** the dropdown shows "Price (low to high)", and the prices read in this order:
$7.99, $9.99, $15.99, $15.99, $29.99, $49.99.

### Sorts by price, high to low @regression
1. Open the inventory page.
2. Choose "Price (high to low)" from the sort dropdown.

**Expected:** the dropdown shows "Price (high to low)", and the prices read in this order:
$49.99, $29.99, $15.99, $15.99, $9.99, $7.99.

### Returns to name A to Z after another sort @regression
1. Open the inventory page.
2. Choose "Price (high to low)".
3. Choose "Name (A to Z)".

**Expected:** the dropdown shows "Name (A to Z)", and the products are back in the A to Z
order from the first scenario.

Notes for the generator:
- **Data-driven.** The four "choose an option" scenarios (Z to A, both price sorts, and
  back to A to Z) all assert the same thing: after a choice, the dropdown shows the label
  and the list is in a given order. Write them as one test body run over a small data
  table (one `test()` per row), not four copied blocks. The default-order scenario has no
  sort action, so it stays a separate test.
- **Price sorts assert the price sequence, not product names.** Two products cost $15.99.
  The site currently lists Bolt T-Shirt before the Red T-Shirt in both price sorts, but
  nothing says that order is intended, so don't assert it. Name sorts assert the full
  list of names.
- **Page object.** Extend `InventoryPage`; sorting is on that page, so it doesn't need a
  new object. It needs the sort dropdown, a `sortBy(label)` action, and the list of
  product names and prices. Probe results from exploration (check them again before
  committing):
  - Dropdown: `getByRole('combobox', { name: 'Sort products' })`. Its option labels are
    the visible text above; values are `az`, `za`, `lohi`, `hilo`. Select by label.
  - The label shown on screen is a separate element, `data-test="active-option"`. The
    `<select>` itself can be asserted with `toHaveValue`, but the visible label is what a
    user sees.
  - Names: `data-test="inventory-item-name"`. Prices: `data-test="inventory-item-price"`.
    Assert order with `toHaveText([...])` on the whole list. This is web-first and checks
    count and order together.

## Out of scope / open questions
- **The sort resets when the page is reopened.** After choosing "Price (high to low)" and
  opening `/inventory.html` again, the dropdown was back to "Name (A to Z)". Is that
  intended, or should the choice be remembered? Not a scenario until someone confirms.
- **How ties are ordered.** See the generator note above. If the order of equal-priced
  items matters (for example, sort by name within a price), that needs a spec.
- **Login.** Covered by `tests/login.spec.ts`.
- Not explored:
  - Whether the sort survives a trip to the cart or an item page and back.
  - Whether sorting changes anything about cart buttons ("Add to cart" / "Remove"
    states moving with their items).
  - Keyboard use of the dropdown.
  - The other published accounts. `problem_user` is commonly reported to have a broken
    sort (not checked here). Only `standard_user` has a saved state.
- The browser console showed errors during the session. They were not investigated and
  had no visible effect on sorting.
