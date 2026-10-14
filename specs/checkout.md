# Checkout — test plan
Source: pasted acceptance criteria (scope and the empty-cart rule) + explored
https://www.saucedemo.com `/cart.html` through `/checkout-complete.html` on 2026-10-13

> **Input quality:** the criteria set the scope, the auth, and the empty-cart rule, but do
> not describe the checkout screens. The page names, totals, confirmation copy and Cancel
> destinations below come from the live site, so they record what checkout does today —
> confirm before trusting them as tests. The empty-cart scenario is the exception: its
> expected outcome is an *assumed* intended behaviour, which the site does not meet.

Scope: the checkout process only — from the cart's Checkout button, through the
information and overview pages, to the order confirmation, plus the Continue and Cancel
buttons along the way. Adding items is a setup step,
not something these tests verify (that is `tests/cart.spec.ts`). Field validation on the
information page is excluded by decision.

## Preconditions
- Auth: every scenario starts already signed in as `standard_user` via
  `test.use({ storageState: STANDARD_USER_STATE })` and opens the inventory page
  directly. No checkout test types credentials.
- Data: none to seed. The cart lives in the browser, so each test starts with an empty
  cart in its own context. Items used: Sauce Labs Backpack ($29.99) and Sauce Labs Bike
  Light ($9.99). Buyer details used on the information page: Ada / Lovelace / 12345 —
  any non-blank values work.

## Scenarios

### Completing an order

#### Completes an order for a single item @smoke
1. Add Sauce Labs Backpack to the cart from the inventory page.
2. Open the cart and click "Checkout".
3. Enter a first name, last name and postal code, and click "Continue".
4. Click "Finish" on the overview page.

**Expected:** the page is `/checkout-complete.html` with the title "Checkout: Complete!"
and the heading "Thank you for your order!". The cart badge is gone.

#### Completes an order for several items and shows them on the overview @regression
1. Add Sauce Labs Backpack and Sauce Labs Bike Light to the cart from the inventory page.
2. Open the cart and click "Checkout".
3. Enter a first name, last name and postal code, and click "Continue".
4. Check the overview page.
5. Click "Finish".

**Expected:** after step 3 the page is `/checkout-step-two.html` with the title
"Checkout: Overview". It lists exactly two items — Sauce Labs Backpack at $29.99 and
Sauce Labs Bike Light at $9.99 — and shows "Item total: $39.98" and "Total: $43.18".
After step 5 the page is `/checkout-complete.html` with the heading "Thank you for your
order!", and the cart badge is gone.

### Continue and Cancel buttons

#### Continues from the information page to the overview @regression
1. Add Sauce Labs Backpack to the cart from the inventory page.
2. Open the cart and click "Checkout".
3. Enter a first name, last name and postal code, and click "Continue".

**Expected:** the page is `/checkout-step-two.html` with the title "Checkout: Overview",
and it lists Sauce Labs Backpack.

#### Cancels from the information page back to the cart @regression
1. Add Sauce Labs Backpack to the cart from the inventory page.
2. Open the cart and click "Checkout".
3. Click "Cancel" on the information page.

**Expected:** the page is `/cart.html`. The cart still lists Sauce Labs Backpack, and the
cart badge shows 1.

#### Cancels from the overview back to the inventory page @regression
1. Add Sauce Labs Backpack to the cart from the inventory page.
2. Open the cart and click "Checkout".
3. Enter a first name, last name and postal code, and click "Continue".
4. Click "Cancel" on the overview page.

**Expected:** the page is `/inventory.html`. No order was placed: the cart badge still
shows 1.

### Empty cart

#### Disables Checkout for an empty cart @regression — KNOWN FAILURE (`test.fail`)
1. Open the cart without adding anything.

**Expected (intended):** the "Checkout" button is disabled.

**Actual today:** the button is enabled. Clicking it opens `/checkout-step-one.html`, and
the order can be carried all the way to "Thank you for your order!" with an item total of
$0. This is a known saucedemo flaw, so the test is marked `test.fail` and is expected to
fail.

Notes for the generator:
- New file `tests/checkout.spec.ts`, copying `tests/cart.spec.ts` for the `test.use`
  line, the item constants and the `beforeEach` that opens the inventory page.
- Checkout has three new pages — information (`/checkout-step-one.html`), overview
  (`/checkout-step-two.html`) and complete (`/checkout-complete.html`). Each gets its own
  thin page object and fixture; do not add their fields to `CartPage`.
- `CartPage` needs a Checkout action. Its header comment says the Checkout button is
  deliberately absent — update that comment when adding it.
- The empty-cart scenario is the only one with no add-to-cart step. Write it as
  `test.fail(...)` with a short comment saying saucedemo lets an empty cart through
  checkout, that this is a known flaw, and that the annotation comes off if the site ever
  fixes it (the test will then report as unexpectedly passing).
- Observed on the live site: the information form is named "Checkout information" with
  textboxes "First Name", "Last Name" and "Zip/Postal Code"; the buttons are "Checkout",
  "Continue", "Cancel" (one on each of the information and overview pages), "Finish" and
  "Back Home"; the confirmation heading is a level-2 heading;
  the page titles are plain text with no heading role, as on the cart page. Verify each
  locator against the running app before it lands in the spec.

## Out of scope / open questions
- **Information-page field validation** (blank first name / last name / postal code) — by
  decision. Not covered here.
- **What should happen with an empty cart?** The criteria say allowing it is a flaw but
  not what the correct behaviour is. The scenario asserts a disabled Checkout button,
  which is the reviewer's assumption (2026-10-13), not a stated requirement. If the real
  intent is an error message or a blocked navigation, the expected outcome changes.
- **Clicking "Continue" with blank fields** — part of the field validation excluded
  above, so the Continue scenario only covers the filled-in case.
- **Where Cancel should go.** The two Cancel scenarios record what the site does today
  (information page → cart, overview → inventory page). Nothing states that the
  different destinations are intended.
- **Tax.** The overview showed "Tax: $3.20" on a $39.98 item total (8%). The several-item
  scenario asserts the item total and the final total but not a tax rule, since none is
  specified.
- Observed, deliberately not scenarios:
  - Payment shows "SauceCard #31337" and shipping "Free Pony Express Delivery!" — fixed
    copy on the overview page.
  - The confirmation page also has a "Generate PDF order" button and a "Back Home" button
    that returns to the inventory page.
  - The cart badge wording is "Cart, 2 items" during checkout and "Cart, empty" after.
- Not explored:
  - Leaving checkout part-way and returning, or reloading mid-flow.
  - Opening the checkout pages directly by URL.
  - The other published accounts (`problem_user` and the rest).
- The browser console showed errors during the session. They were not investigated and
  had no visible effect on checkout.
