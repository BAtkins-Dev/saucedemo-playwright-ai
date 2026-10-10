# Process log

A running record of each round of work with the Playwright AI Kit: what was asked, what
was found, what was fixed, and how it was verified. Newest entry last.

## 2026-10-09 — Login page

Page: https://www.saucedemo.com/

### What I asked
1. **plan-tests:** plan positive and negative tests for the login page. Ignore headers,
   footers and anything not related to logging in. End positive tests once they reach
   the inventory page.
2. **Plan decisions:** no more positive tests; keep the seed file but skip its two
   tests that the new spec duplicates; keep the "requires both fields" scenario.
3. **generate-tests:** automate the plan.
4. **convention-check:** review the new spec.
5. Fix two of the check's nits (the loose URL assertion and the duplicated describe
   name), then apply the same URL fix to the seed.

### What was found

**About the page (from live exploration; there is no written spec)**
- The form is a username field, a password field and a **Login** button. A rejected
  login stays on `/` and shows an error banner (`role="alert"`) whose text starts
  "Epic sadface: ".
- Wrong password and unknown username give the same message: "Username and password do
  not match any user in this service".
- `locked_out_user` with the correct password gives a different message: "Sorry, this
  user has been locked out." This reveals that the account exists.
- A blank username gives "Username is required", whether or not a password is entered.
  A blank password with a username gives "Password is required".
- Pressing Enter in either field submits the form. The banner has a "Dismiss error"
  button, and a second failed attempt replaces the banner's message.
- `standard_user` / `secret_sauce` lands on `/inventory.html` with the title "Products".

**About the generated spec (from convention-check)**
- No must-fix or should-fix findings. Three nits:
  1. The positive test's URL assertion was a loose regex; the conventions say URLs are
     matched exactly.
  2. `describe('Login')` and two test titles were identical in the new spec and the
     seed, so reports showed the same title from two files.
  3. `toHaveURL('/')` in the negative tests is already true before the form is
     submitted. Left as is: it runs after the banner assertion and would fail if a
     rejected login navigated away.

### What was produced and fixed
- `specs/login.md` — plan with one positive scenario (`@smoke`) and six negative
  scenarios (`@regression`): invalid password, unknown username, locked-out user,
  missing username, missing password, both fields blank.
- `tests/login.spec.ts` — the positive test, plus one data-driven test body that runs
  the six negative rows as six separately reported tests. It uses the existing
  `LoginPage` and `InventoryPage`; no new page objects or fixtures.
- `tests/seed.spec.ts` — **two tests are intentionally skipped** with `test.skip`:
  "logs in with valid credentials" and "rejects an invalid password".
  `tests/login.spec.ts` now covers both, so running them in the seed as well would run
  the same checks twice on every browser. They stay in the file as the style example
  the generator imitates; do not delete or un-skip them. The seed's logout test still
  runs.
- Fix 1: the positive URL assertion is now `toHaveURL('/inventory.html')`, in both
  `tests/login.spec.ts` and the seed's skipped test.
- Fix 2: the seed's describe block is renamed from `'Login'` to `'Seed'`, so reports
  show "Seed › …" and "Login › …" separately.

### Verification
- Playwright version check: installed 1.64.0 matches `.claude/agents-playwright-version`.
- All six negative cases were submitted by hand against the live form during planning,
  and the error text recorded from the page.
- The spec was written directly, not through the generator agent. Its locators come
  from the existing page objects and were seen on the live form during planning.
- First run of `tests/login.spec.ts` with the seed: 24 passed, 6 skipped across
  Chromium, Firefox and WebKit. Per browser: login 7 passed, seed 1 passed and 2
  skipped.
- After fixes 1 and 2 in the login spec and the describe rename: the same result, 24
  passed and 6 skipped.
- The seed's URL assertion change was not run, because that test is skipped. The
  identical assertion passes in the login spec.

### Still open
- The expected error messages are what the site does today. There is no spec to
  confirm they are intended, including the locked-out message revealing that an
  account exists.
- Not explored and out of scope by decision: the other published accounts
  (`problem_user`, `performance_glitch_user`, `error_user`, `visual_user`), opening
  `/inventory.html` while logged out, Enter-to-submit, the banner's dismiss button,
  and case or whitespace handling of credentials.
- "Requires both fields" is kept by decision, although it only proves that the
  username check wins when both fields are blank.
- The spec is a draft: it has not been through PR review, and there is no CI.

## 2026-10-09 — Cart

Pages: https://www.saucedemo.com/inventory.html and https://www.saucedemo.com/cart.html

### What I asked
1. **plan-tests** (pasted brief): log in as `standard_user` to reach the inventory page;
   cover adding items to the cart and the cart badge count; cover the cart page itself
   (contents, removing items). Do not click Checkout or go past the cart page, and do
   not re-cover login.
2. **Plan decision:** every cart test logs in from a saved login state, not through the
   form.
3. **generate-tests:** automate the plan.
4. **Project rule:** change `PROJECT.md` so all specs use `storageState` except
   `login.spec.ts` and `seed.spec.ts`; update the plans in `specs/` to match; re-run
   all tests.
5. **Rule wording:** state in `PROJECT.md` that all new specs must start from the saved
   `storageState`.
6. **Review pass on `tests/cart.spec.ts`**, after the `PROJECT.md` edits were verified:
   run convention-check, then fix the describe block naming; assert the add before the
   removal in two tests; use soft asserts in the cart contents loop.

### What was found

**About the pages (from live exploration; the brief set scope but no acceptance criteria)**
- "Add to cart" on a product changes its button to "Remove" and shows a badge on the
  header cart link with the item count. Removing the last item removes the badge.
- The cart link's accessible name carries the count: "Cart, empty", "Cart, 1 items",
  "Cart, 2 items".
- The cart page (`/cart.html`, title "Your Cart") lists each item with quantity, name,
  description, price and a "Remove" button. Removing a row updates the badge.
- An empty cart shows only the column headings, "Continue Shopping" and "Checkout".
  Checkout is present even when the cart is empty; it was never clicked.
- "Continue Shopping" returns to the inventory page, where an item removed in the cart
  shows "Add to cart" again.
- Cart contents are kept in the browser's local storage (`cart-contents`).

**About the saved login state**
- The login is a `session-username` cookie that lasts 10 minutes. A browser session
  left over from planning had expired and was bounced to the login page about 35
  minutes later.
- One state file recorded in Chromium works in Firefox and WebKit.
- The saved state has an empty cart, so each test still starts clean.

**About the generated spec (from the review pass)**

Convention-check reported no must-fix findings and two should-fix findings:
1. "Removes an item from the inventory page" asserted only the end state (badge gone,
   "Add to cart" showing), which is already true before the test does anything. Nothing
   proved the item had been added first.
2. The two describe blocks were named by page ("Cart — inventory page", "Cart — cart
   page"); the conventions say to group by sub-feature, not by page.

My own read of the spec found two more that the check did not flag:

3. "Empties the cart when the last item is removed" had the same gap as finding 1: no
   check that the add worked before opening the cart and removing the item.
4. In "shows the added items in the cart", the per-item price and quantity checks were
   hard assertions in a loop, so a wrong value on the first item hid the second item's
   results.

The check also noted two nits that were left alone: the cart-page tests repeat "add
items, open cart", and the cart badge locator is defined in both page objects.

### What was produced and fixed
- `specs/cart.md` — plan with six scenarios. Inventory page: adds an item (`@smoke`);
  counts each added item on the badge; removes an item. Cart page: shows the added
  items (`@smoke`); removes an item; empties the cart when the last item is removed.
- `tests/cart.spec.ts` — one test per scenario, starting signed in via
  `test.use({ storageState: STANDARD_USER_STATE })`.
- `tests/auth.setup.ts` — signs in once per run through `LoginPage.signIn()` and saves
  the state to `auth/standard-user.json` (gitignored).
- `playwright.config.ts` — new `setup` project; the three browser projects depend on it.
- `tests/pages/cart.page.ts` — new thin page object. Rows are scoped by product name.
- `tests/pages/inventory.page.ts` — added per-item add and remove actions, the cart
  link and the cart badge.
- `tests/fixtures/index.ts` — added the `cartPage` fixture and the
  `STANDARD_USER_STATE` path constant.
- `PROJECT.md` — the auth rule is now: every spec starts from the saved `storageState`,
  except `tests/login.spec.ts` and `tests/seed.spec.ts`, which start signed out because
  login is what they exercise. The state is opt-in per spec, not set globally in the
  config.
- `specs/login.md` and `specs/cart.md` — preconditions reworded to point at that rule;
  the login plan is marked as one of the two exceptions.
- `PROJECT.md` — added the explicit line that all new specs must start from the saved
  `storageState`, and that `plan-tests` / `generate-tests` should do so without being
  asked.
- Review fix 1: "removes an item from the inventory page" asserts the badge shows 1
  after the add, before the removal.
- Review fix 2: the describe blocks are renamed "Cart — adding items" and "Cart — cart
  contents". The plan's headings in `specs/cart.md` still say "Inventory page" and
  "Cart page".
- Review fix 3: "empties the cart when the last item is removed" asserts the badge
  shows 1 after the add, before opening the cart.
- Review fix 4: the price and quantity checks in the loop are `expect.soft`. The URL,
  title and item-count assertions before the loop stay hard.

### Verification
- Every locator in the two page objects was checked against the live site and resolved
  to exactly one element, on both the inventory and cart pages.
- The spec was written directly, not through the generator agent.
- First run of the whole suite (`npx playwright test`) after generating: 43 passed, 6
  skipped in 43 seconds. Setup 1; per browser: cart 6, login 7, seed 1 passed and 2
  skipped.
- Re-run after the `PROJECT.md` and plan edits: 43 passed, 6 skipped in 34 seconds. The
  edits were documentation only, so this confirms nothing else drifted.
- After each review fix, the affected tests were re-run on all three browsers and
  passed: the whole cart spec after the describe rename (19 passed, including setup),
  and the single edited test after each of the other three fixes.
- Final run of the whole suite after all review fixes: 43 passed, 6 skipped in 36
  seconds. Setup 1; per browser: cart 6, login 7, seed 1 passed and 2 skipped.
- The six skipped tests are the seed's two intentionally skipped tests on each browser
  (see the login entry above).

### Still open
- The expected cart behaviour is what the site does today; there is no spec to confirm
  it.
- A run longer than 10 minutes would outlast the saved session and fail the cart tests.
  The suite takes under a minute now.
- A new spec that forgets the `test.use` line starts signed out. Nothing enforces the
  rule; it is a convention in `PROJECT.md`.
- Out of scope by decision: Checkout and everything past the cart page.
- Not explored: item detail pages, cart persistence across reload or re-login, "Reset
  App State", the other four products, and the other published accounts.
- `convention-check` was run on `tests/cart.spec.ts` once, before the review fixes, and
  has not been re-run since. It caught two of the four issues; the other two came from
  reading the spec by hand, so a clean check is not a substitute for that read.
- The two nits from the check (repeated "add items, open cart" setup; the cart badge
  locator defined in two page objects) are unfixed by choice.
- The plan's headings in `specs/cart.md` no longer match the spec's describe names.
- The spec is a draft: it has not been through PR review, and there is no CI.
