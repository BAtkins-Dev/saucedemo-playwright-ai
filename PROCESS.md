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

## 2026-10-13 — Checkout

Pages: https://www.saucedemo.com/cart.html through
https://www.saucedemo.com/checkout-complete.html

### What I asked
1. **plan-tests** (pasted criteria): checkout tests that start signed in from
   `STANDARD_USER_STATE`, add items to the cart as a simple setup step, and focus only on
   the checkout process. Happy paths end at the order confirmation. No validation of the
   personal information fields. Checking out with an empty cart is a known saucedemo
   flaw: include it as `test.fail` with a short explanation.
2. **Plan decisions:** the empty-cart test asserts that the Checkout button is disabled.
   This is my assumption; I don't know the actual requirement. Add tests for the Continue
   and Cancel buttons.
3. **generate-tests:** automate the plan.
4. **Diagnose** the flaky failures from the first runs, then **apply the `open()` fix**
   that came out of it.
5. **Turn on one local retry**, and log the investigation here.
6. **convention-check** on `tests/checkout.spec.ts`, then apply two findings: add a
   comment to the empty-cart test about what `test.fail` can't detect, and replace the
   repeated setup with a helper. Re-run and log.

### What was found

**About the pages (from live exploration; the criteria set scope but not the screens)**
- Checkout is three pages: "Checkout: Your Information" (`/checkout-step-one.html`) with
  First Name, Last Name and Zip/Postal Code; "Checkout: Overview"
  (`/checkout-step-two.html`) with the items, payment and shipping text, and price
  totals; "Checkout: Complete!" (`/checkout-complete.html`) with the heading "Thank you
  for your order!".
- Backpack + Bike Light: item total $39.98, tax $3.20, total $43.18.
- Cancel on the information page returns to the cart with items kept. Cancel on the
  overview returns to the inventory page, items still in the cart.
- **Empty cart flaw confirmed:** Checkout is enabled on an empty cart, and a $0 order
  goes all the way to "Thank you for your order!".
- Moving from the cart to checkout is an in-page route change, not a page load.

**About the flaky runs (investigation)**

Three kinds of intermittent failure showed up. None is specific to the new spec.

1. *Load timeouts.* Opening a page directly (`open()`) sometimes timed out after 30
   seconds in `beforeEach`, mostly on Firefox, once in the pre-existing `cart.spec.ts`.
   A trace showed why: saucedemo answers `/inventory.html` with a **404** and redirects
   to `/?/inventory.html`, so every `open()` reloads the whole app. `page.goto` waited
   for the full load event, which needs six product images and four web-font files, and
   several of those requests never finished.
2. *Actions stalling, Firefox.* A fill or click on the checkout information page waited
   the full 30 seconds; in one trace two fields filled normally and the third hung. Five
   images and four font requests from the inventory page were still pending at the time.
   The site also loads scripts from random-looking paths, which look like bot
   protection.
3. *Lost First Name, WebKit.* Twice in the first full run, and once in the first stress
   run, WebKit left First Name empty after the test had filled it, so Continue showed
   "First Name is required". It did not happen again in any later run.

What was ruled out or tested:
- **Form rebuilt after it appears (lost First Name):** ruled out in Chromium. The form
  is created once on the route change, and a filled value still holds 1.5 seconds
  later. Not checked in WebKit itself.
- **Too many workers on WebKit:** WebKit alone with 10 workers passed every time (33 of
  33 with the affected tests repeated 8 times).
- **Images and fonts as the cause of the Firefox stalls:** not supported. Blocking them
  first gave three clean runs, but when blocked and unblocked runs were alternated, a
  blocked run failed once and both unblocked runs passed.
- **Variance:** the identical Firefox-only run (checkout spec repeated 4 times, 21
  tests) failed 9, then 1, then 0 and 0. Failures were also worse after bursts of
  repeated runs.

Working theory, **unconfirmed**: the public site sometimes slows or holds our requests
(possibly throttling), and Firefox occasionally freezes on a page when that happens. No
fix for that was found.

**About the generated spec (from convention-check)**

No must-fix findings. Two should-fix findings:
1. The empty-cart `test.fail` is green on *any* failure, so it can't tell "the flaw is
   still there" from "the test is broken" (for example, a renamed Checkout button).
2. Add item, open cart, click Checkout was copied into five tests.

Four nits, left alone:
3. The information form's inputs have `aria-label`s, so `getByLabel` would rank above
   the `getByPlaceholder` locators used, and the page object's comment saying the inputs
   have no label is misleading. `getByLabel` was not checked live.
4. The Continue test overlaps step 1 of the several-items test. Kept because the plan
   asks for it.
5. The three checkout page objects' `open()` methods are unused, and opening those pages
   by URL was never explored.
6. The empty-cart test waits the full 5-second timeout on each browser before failing
   as expected.

### What was produced and fixed
- `specs/checkout.md` — plan with six scenarios. Completing an order: single item
  (`@smoke`); several items, with the overview's items and totals (`@regression`).
  Continue and Cancel: continues to the overview; cancels from the information page
  back to the cart; cancels from the overview back to the inventory page (all
  `@regression`). Empty cart: Checkout disabled (`@regression`, `test.fail`).
- `tests/checkout.spec.ts` — one test per scenario, starting signed in via
  `test.use({ storageState: STANDARD_USER_STATE })`. The empty-cart test is
  `test.fail` with a comment: it is a known saucedemo flaw, the disabled button is an
  assumed intent, and the annotation comes off if the site is fixed.
- New page objects `tests/pages/checkout-information.page.ts`,
  `checkout-overview.page.ts` and `checkout-complete.page.ts`, each with a fixture in
  `tests/fixtures/index.ts`.
- `tests/pages/cart.page.ts` — added the Checkout button and a `checkout()` action;
  its header comment no longer says Checkout is out of scope.
- **`open()` fix:** all six page objects (login, inventory, cart and the three checkout
  pages) now call `goto(..., { waitUntil: 'domcontentloaded' })` and do not wait for
  images and fonts. The tests' own assertions wait for the elements they need.
- `playwright.config.ts` — **one local retry** (`retries: process.env.CI ? 2 : 1`). A
  test that passes on retry is reported as flaky, so the problem stays visible.
- Review fix 1: the empty-cart test's comment now says `test.fail` is green on any
  failure, so a reviewer should check the report shows the failure on `toBeDisabled`, not
  on an earlier line.
- Review fix 2: a `startCheckout(inventoryPage, cartPage, ...items)` helper in
  `tests/checkout.spec.ts` adds the items, opens the cart and clicks Checkout. All five
  tests with items use it; the empty-cart test does not. `tests/cart.spec.ts` was not
  changed.

### Verification
- Playwright version check: installed 1.64.0 matches `.claude/agents-playwright-version`.
- Every locator in the new page objects, and every assertion target, was checked
  against the live site in one walk through the flow and resolved to exactly one
  element. The overview's prices and totals matched the plan.
- The spec was written directly with the playwright-test MCP, not through the generator
  agent.
- First run (cart + checkout, three browsers): 35 passed, 2 failed — the WebKit lost
  First Name.
- Three normal runs (cart + checkout): 37 passed; 36 passed and 1 Firefox load timeout;
  37 passed.
- After the `open()` fix, three full-suite runs: 2 failed, 4 failed, then 61 passed. A
  further run failed 3 tests, all Firefox stalls on the information page. **The `open()`
  fix did not remove the flakiness**, and the variance is too large to say whether it
  reduced it. It is kept because tests should not depend on images and fonts they never
  use.
- After the retry change, one full-suite run: 61 passed, 6 skipped, with no retries
  needed.
- After review fixes 1 and 2, one full-suite run: 60 passed, 1 flaky, 6 skipped. Every
  checkout test passed on its first attempt. The flaky test was the pre-existing cart
  test "empties the cart when the last item is removed" on Firefox: after Remove, the
  cart still listed 1 item. It passed on the retry. This looks like the same Firefox
  pattern, an action that doesn't take effect, now seen on the cart page too.
- No type-check was run separately (`tsc` is not installed); Playwright compiled the
  spec when it ran.
- A later full-suite run by the user, after the review fixes: 61 passed, 6 skipped in
  54.4 seconds. No flaky or failed tests were reported, so the local retry was not needed.
- The empty-cart `test.fail` fails as expected on all three browsers and counts as
  passed.
- The six skipped tests are the seed's two intentionally skipped tests on each browser.

### Still open
- **The Firefox stalls and the WebKit lost First Name are not explained.** The local
  retry hides single failures, so check reports for tests marked flaky. Next steps if
  they keep appearing: run fewer workers (10 now, half of 20 cores) and compare over
  spaced-out runs; or capture a Firefox trace of a stall that includes the page's own
  scripts.
- The empty-cart expected outcome (disabled Checkout button) is an assumption; the real
  requirement is unknown.
- The Cancel destinations, totals and confirmation copy are what the site does today;
  there is no spec to confirm them. Tax is not asserted as a rule.
- Convention-check nits 3–6 are unfixed: label vs placeholder locators on the
  information form, the overlapping Continue test, the unused `open()` methods, and the
  empty-cart test's 5-second wait.
- `tests/cart.spec.ts` still repeats its own "add items, open cart" setup; the helper
  was applied to the checkout spec only.
- Out of scope by decision: information-page field validation, including Continue with
  blank fields.
- Not explored: leaving checkout part-way and returning, reloading mid-flow, opening
  checkout pages by URL, "Generate PDF order", and the other published accounts.
- `convention-check` ran once, before review fixes 1 and 2, and has not been re-run.
- The spec is a draft: it has not been through PR review, and there is no CI.

## 2026-10-14 — Sorting: full-suite regression run

After adding `tests/sorting.spec.ts` and the sorting additions to `InventoryPage` (sort
dropdown, visible sort label, name and price lists, `sortBy()`; nothing existing changed),
one full-suite run on all three browsers to check the existing tests.

- **Result:** 70 passed, 6 skipped, 6 flaky, 0 failed (about 1.5 minutes). The skipped
  tests are the seed's two intentionally skipped tests on each browser.
- **All six flaky tests were on Firefox**, and each passed on the retry. Every first
  attempt was a 30-second timeout in code the sorting change did not touch:
  - cart "counts each added item", "removes an item from the inventory page", "empties
    the cart", and checkout "completes an order for a single item": stalled while
    loading the inventory page (stuck on `/?/inventory.html`) or clicking "Add to cart".
  - checkout "continues to the overview": the "Continue" click never finished.
  - checkout "disables Checkout for an empty cart" (`test.fail`): timed out in
    `beforeEach`. On the retry it failed on `toBeDisabled`, as intended.
- The 15 new sorting tests all passed on the first attempt.
- **Conclusion:** no regression from the sorting change. Six flaky tests is more than the
  previous recorded full-suite runs (1 flaky, then none). The suite now runs 15 more tests in parallel against the
  live site, which may add load. One run can't tell that apart from a slow site, so it is
  not confirmed.
- **Still open:** run Firefox on its own a few times and compare flaky counts; see the
  Checkout entry's "Still open" for the existing Firefox stall notes.

## 2026-10-14 — Sorting: convention check

`convention-check` on `tests/sorting.spec.ts` and the sorting additions to
`InventoryPage`.

- **Result:** clean. Nothing must be fixed and nothing should be fixed.
- **Three style suggestions, skipped by decision:**
  - The label checks match the option wording exactly (`toHaveText('Name (Z to A)')`).
    Defensible because they are fixed option names. If the wording changes, loosen the
    match or check the dropdown's value (`toHaveValue('za')`).
  - The data-driven test picks the name or price list with a ternary. It could take the
    list from each table row instead.
  - `as const` on the table forces the `[...expected]` copy. It could be dropped and the
    rows typed instead.
- The spec was not edited. A convention check is a heuristic audit, not a test pass; the
  spec is still a draft awaiting PR review, and there is no CI.

## 2026-10-14 — Logout

Pages: https://www.saucedemo.com/inventory.html and https://www.saucedemo.com/

### What I asked
1. **plan-tests:** plan tests for logging out. After logging out, the login page should
   show.
2. **generate-tests:** automate the plan, and skip the seed's existing logout test the
   same way its other two tests are skipped.
3. **Process log:** record the Firefox `/?/inventory.html` timeout recurring (separate
   entry below), then this entry.

### What was found

**About the pages (one-line criterion, details from live exploration)**
- Choosing "Logout" from the side menu lands on `/`. The login page shows the Username
  and Password fields and the Login button, with no error banner.
- After logging out, going straight to `/inventory.html` returns the user to `/`, and
  the error banner reads "Epic sadface: You can only access '/inventory.html' when you
  are logged in." So the session really ends, and it isn't just a page change.

**About existing coverage**
- `tests/seed.spec.ts` already had "logs back out from the inventory page", and
  `specs/login.md` said logout was covered there. That test signs in through the form
  and only checks that the Login button is visible.

### What was produced and fixed
- `specs/logout.md`: a plan with two scenarios. "Shows the login page after logging
  out" (`@smoke`) and "ends the session, so a signed-in page is no longer reachable"
  (`@regression`). Open questions: overlap with the seed; whether logging out could
  break the shared saved session; logging out from other pages; Back after logout.
- `tests/logout.spec.ts`: one test per scenario, starting signed in via
  `test.use({ storageState: STANDARD_USER_STATE })`. It uses the existing
  `InventoryPage.signOut()` and `LoginPage` locators. No new page objects or fixtures.
  The error-banner check matches the stable core of the message, not its full text.
- `tests/seed.spec.ts`: "logs back out from the inventory page" is now `test.skip`, with
  the same comment as the other two. **All three seed tests are now skipped.** The file
  stays as the style example; do not delete or un-skip them.
- `specs/login.md`: two notes that said the seed's logout test still runs and covers
  logout now point to `specs/logout.md`.

### Verification
- Playwright version check: installed 1.64.0 matches `.claude/agents-playwright-version`.
- Every locator was already in the page objects. The login form and the error banner
  were seen live during planning, and the menu and Logout button were used when the
  seed's logout test ran during planner setup.
- The spec was written directly, not through the generator agent.
- `tests/logout.spec.ts` with the seed, three browsers: 7 passed (setup plus 6 logout),
  9 skipped (the seed's three tests on each browser).
- First full-suite run: 77 passed, 2 flaky, 9 skipped. Both flaky tests were on Firefox
  (the logout "ends the session" test and checkout "continues to the overview") and
  passed on retry. Logging out did not break the shared saved session for tests running
  in parallel, which answers that open question in the plan.
- A second full-suite run: all six logout tests passed on the first attempt. Other
  Firefox tests failed in that run; its totals were not captured.
- Firefox repeat runs of the logout spec found intermittent timeouts. See the next
  entry.

### Still open
- The expected URL and error text are what the site does today. The only written
  requirement is the one-line criterion.
- Firefox timeouts, mostly in `InventoryPage.open()` (next entry). Not fixed, because
  that page object is shared by every signed-in spec.
- Not planned, by choice: logging out from pages other than the inventory page (the
  menu is the same everywhere), browser Back after logout, and the other menu items.
- `convention-check` has not been run on `tests/logout.spec.ts`.
- The spec is a draft: nothing is committed, it has not been through PR review, and
  there is no CI.

## 2026-10-14 — Firefox `/?/inventory.html` timeout recurs (sorting and logout rounds)

The Firefox timeout in `InventoryPage.open()` came back in both the sorting and logout
rounds, with the same symptom: the page lands on `/?/inventory.html` (saucedemo's 404
redirect for direct links) and the first action on the inventory page waits the full 30
seconds. The failure rate is about the same as in earlier rounds. Earlier runs varied too
much (0 to 9 failures in 21 tests) to compare more precisely.

- **Sorting round:** the full-suite regression run had 6 flaky tests, all on Firefox,
  stuck on `/?/inventory.html` or on the first click after it (see the Sorting
  regression entry above). A later Firefox-only run of `cart.spec.ts` and
  `sorting.spec.ts`, repeated 4 times with no retries: 6 of 45 failed. Five of the six
  call logs show the navigation to `/?/inventory.html`, followed by a wait for
  "Add to cart" or for the sort label.
- **Logout round:** `tests/logout.spec.ts` on Firefox, repeated, about 50 tests in all:
  4 failures. Two show the navigation to `/?/inventory.html`, then a wait for the
  "Open Menu" button. One opened the menu but never found the "Logout" button. One had
  no call log captured. One full-suite run also had the logout test pass only on retry.
  Chromium and WebKit did not fail.
- **Not changed:** `InventoryPage.open()` is shared by every signed-in spec, so changing
  it is a separate decision. See the Checkout entry's "Still open" for earlier
  investigation and next steps.

## 2026-10-14 — Logout: convention check

`convention-check` on `tests/logout.spec.ts`.

- **Result:** clean. Nothing must be fixed and nothing should be fixed.
- **Three style suggestions:**
  1. The "no error banner" check after logout (`expect(loginPage.error).toBeHidden()`)
     is also true before logout, because the inventory page has no banner. It still
     guards against logout landing on the login page with an error. **Applied:** a
     comment above the check says this.
  2. The second test calls `inventoryPage.open()` while signed out, although the page
     object's comment says `open()` only works when signed in. The call is deliberate.
     **Applied:** a comment says the test visits a signed-in page while signed out on
     purpose.
  3. The first test checks the Username field, Password field and Login button, which
     all prove the same thing. Trimming to the Login button would match the seed.
     **Skipped by decision**; the plan asks for all three.
- **Run after the fixes:** `tests/logout.spec.ts` on all three browsers: 7 passed
  (setup plus both tests on Chromium, Firefox and WebKit), no retries needed. Only
  comments changed, so the tests behave as before.
- The Firefox `InventoryPage.open()` timeouts (previous entry) are outside the
  conventions and were not part of the check.
- Nothing is committed. A convention check is a heuristic audit, not a test pass; the
  spec is still a draft awaiting PR review, and there is no CI.

## 2026-10-15 — Customer checkout validation

Page: https://www.saucedemo.com/checkout-step-one.html

### What I asked
1. **plan-tests** (pasted brief): data-driven tests, with data in
   `checkoutValidation.json`, for the First Name, Last Name and Zip/Postal Code fields
   on the checkout information page. Do not repeat login, adding to cart or checkout.
   Stop after clicking Continue. Use fixtures to log in and arrive at the page. Name
   the spec `customerCheckoutValidation.spec.ts`.
2. **Plan decisions:**
   - Follow the house rule for arriving at the page: the auth and page-object
     fixtures, with `.open()` in the spec. Fixtures do not navigate.
   - Mark whitespace-only input as a known failure.
   - For the postal code, check only that the field has data, regardless of format.
3. **generate-tests:** automate the plan.
4. **convention-check** on the new spec, then log this round.

### What was found

**About the page (from live exploration; the brief set scope but not the rules)**
- A signed-in user with an **empty cart** can open `/checkout-step-one.html` directly,
  so the tests don't need to add items or go through the cart.
- Valid values (Ada / Lovelace / 12345) go to `/checkout-step-two.html`, title
  "Checkout: Overview".
- Each blank field is rejected, the page stays on step one, and the error banner
  (`role="alert"`) shows "Error: First Name is required", "Error: Last Name is
  required" or "Error: Postal Code is required".
- With several fields blank, the first one in form order wins.
- On any rejection, all three inputs are marked as errors.
- **Whitespace-only values are accepted:** three spaces in every field goes through to
  the overview. This may be a defect.
- **No postal-code format check:** `abc` and `1` are accepted.

**About the planner**
- `planner_setup_page` with the default seed failed with "seed test not found", because
  all three tests in `tests/seed.spec.ts` are now skipped. Planning was started from
  `tests/logout.spec.ts` instead, and the browser was signed in by hand for
  exploration.

**About the generated spec (from convention-check)**
- Clean: nothing must be fixed and nothing should be fixed. Three style suggestions,
  none applied:
  1. The information page's inputs have `aria-label`s, so `getByLabel` would rank
     above the `getByPlaceholder` locators used, and the page object's "no <label>"
     comment is misleading. This is the same nit as in the Checkout entry, carried
     over. `getByLabel` has not been checked live.
  2. The `accepted` loop has one row today, so it adds nothing until a second row
     arrives. No change suggested.
  3. The camelCase file name differs from the other specs' lowercase names. It was
     chosen in the brief, so it isn't a finding.

### What was produced and fixed
- `specs/customerCheckoutValidation.md`: the plan with five scenarios from the JSON.
  One accepted: continues to the overview with all fields filled (`@smoke`). Four
  rejected (`@regression`): requires a first name, requires a last name, requires a
  postal code, and rejects whitespace-only values (known failure). It also records
  the three decisions.
- `tests/data/checkoutValidation.json`: the `accepted` and `rejected` lists. Each row
  has `title`, `firstName`, `lastName` and `postalCode`. Rejected rows add an
  expected `error`, and the whitespace row adds a `knownFailure` reason.
- `tests/customerCheckoutValidation.spec.ts`: two loops over the JSON, one per list,
  so each row runs as its own `test()`. It starts signed in via
  `test.use({ storageState: STANDARD_USER_STATE })`, gets `checkoutInformationPage`
  from the fixture, and calls `.open()` in `beforeEach`.
  - Accepted rows check the overview URL and title.
  - Rejected rows check the banner text without the "Error: " prefix, then that the
    URL is still step one.
  - Rows with `knownFailure` call `test.fail` with that reason, with a comment that
    `test.fail` is green on any failure.
- `tests/pages/checkout-information.page.ts`: added an `error` field for the error
  banner. Nothing else in the page object changed.
- **Known failure:** the whitespace row expects "First Name is required". Rejecting
  whitespace is an *assumed* intent, not a stated requirement. Remove `knownFailure`
  from the row if the site starts rejecting whitespace; until then the row reports
  as unexpectedly passing.

### Verification
- Playwright version check: installed 1.64.0 matches `.claude/agents-playwright-version`.
- All ten field combinations explored were submitted against the live form, and the
  outcomes recorded.
- The assertion targets were checked live before the spec was written:
  - The error banner is the only `alert` on the page, and it appears only after
    Continue.
  - The overview title reads "Checkout: Overview".
- The spec was written directly with the playwright-test MCP, not through the
  generator agent.
- `tests/customerCheckoutValidation.spec.ts` on all three browsers: 16 passed (setup
  plus 15 tests). The whitespace row counts as passed because it failed as expected.
  On Chromium, it failed on the banner check (line 42), not on an earlier line.
- Full suite: 94 passed, 9 skipped in 57.5 seconds, with no flaky tests. The skipped
  tests are the seed's three tests on each browser.
- The convention check did not change the spec, so no re-run was needed.

### Still open
- The expected error messages and the step-two destination are what the site does
  today; there is no spec to confirm them.
- The whitespace known failure rests on an assumed intent.
- Not planned, by decision: postal-code format; which error wins with several fields
  blank; the error styling on every input; the banner's dismiss button.
- `tests/seed.spec.ts` has no running test, so the planner can't use it as its seed.
  Either un-skip one seed test or keep pointing the planner at another spec.
- The convention-check nits are unfixed.
- The spec is a draft: nothing is committed, it has not been through PR review, and
  there is no CI.

## 2026-10-15 — Users API (reqres.in)

Endpoint: https://reqres.in/api/users

### What I asked
1. **plan-tests:** API tests for `https://reqres.in/api/users` covering POST, GET, GET
   404, PUT, PATCH and DELETE, checking the status code and response body. Name the
   spec `users.spec.ts` and put it in `tests/api/`.
2. **generate-tests:** automate the plan.
3. Add a dedicated `api` project to `playwright.config.ts`: no browser (request only),
   no `setup` dependency. Make the browser projects skip `tests/api/`.
4. Add the API run command to `PROJECT.md`, and make `tests/api/` exempt from the
   `storageState` rule.
5. Do one last run of the API tests and log this round.

### What was found

**About the API (from live calls; there is no written contract)**
- reqres is a public **mock** API, separate from saucedemo. Writes are echoed back but
  not stored, so the tests can only prove the response contract, not that data
  changed.
- No API key is needed today: every call gave the same result with and without the
  `x-api-key` header.
- Observed responses:
  - `GET /api/users/2`: 200, `data` is Janet Weaver (id 2) with an `avatar` URL.
  - `GET /api/users/23`: 404, body `{}`.
  - `POST /api/users`: 201, echoes `name` and `job`, adds a string `id` and `createdAt`.
  - `PUT /api/users/2`: 200, echoes `name` and `job`, adds `updatedAt`.
  - `PATCH /api/users/2`: 200, echoes only the sent `job`, adds `updatedAt`.
  - `DELETE /api/users/2`: 204, empty body.
- Every body carries `support` and `_meta` blocks of reqres marketing copy. The tests
  don't check them.

**About the config**
- Before this round, every spec ran on all three browsers, and each browser project
  depended on the saucedemo `setup` sign-in. The API spec ran 3× and paid for a login
  it never used.

### What was produced and fixed
- `specs/api/users.md`: the plan, with six scenarios, one per call. GET by id and POST
  are `@smoke`; the rest are `@regression`. PUT and PATCH stay separate tests because
  PATCH also checks that `name` is absent.
- `tests/api/users.spec.ts`: six tests using the `request` fixture.
  - Imports `test`/`expect` from `@playwright/test`, not `./fixtures`.
  - Sets `baseURL: 'https://reqres.in'` with `test.use`.
  - Checks the status code, then the contract fields: `toMatchObject` for echoed
    fields, type checks for `id`, ISO-8601 format for the timestamps, and an empty
    body for DELETE.
- `playwright.config.ts`:
  - New `api` project: `testMatch: /api[\/].*\.spec\.ts/`, no device, no
    dependencies.
  - `chromium`, `firefox` and `webkit` now have `testIgnore: /api[\/]/`.
  - The pattern matches `/` and `\`, so it works on Windows and Linux.
- `PROJECT.md`:
  - Added "Run the API tests: `npx playwright test --project=api`".
  - Added an Auth exemption for `tests/api/`: no `storageState`, imports from
    `@playwright/test`, sets its own `baseURL`, runs in the `api` project.
    `tests/api/users.spec.ts` is the example to copy.
  - The old "two exceptions are the only ones" line now says they are the only UI
    exceptions.

### Verification
- Playwright version check: installed 1.64.0 matches `.claude/agents-playwright-version`.
- The spec was written directly, not through the generator agent, which finds
  selectors by driving a browser. An API spec has no selectors.
- Before the config change: 19 passed on all three browsers (setup plus 6 tests × 3).
- After the config change:
  - `npx playwright test --list` shows 109 tests. The 6 users tests appear only under
    `[api]`; chromium, firefox and webkit list 34 UI tests each; setup lists 1.
  - `npx playwright test --project=api`: 6 passed in 1.9 seconds, and setup did not run.
- Final run, `npx playwright test --project=api`: **6 passed in 972 ms**, no retries,
  no flaky tests.
- The full UI suite was not re-run. The config change only adds `testIgnore` for
  `tests/api/` to the browser projects, and `--list` confirms they keep their 34 tests.

### Still open
- The expected statuses and fields are what reqres returns today; there is no
  contract to confirm them.
- The suite depends on a third-party service. It fails if reqres is down, starts
  requiring an API key (then add `x-api-key` via `extraHTTPHeaders` from `.env`), or
  changes its responses. `test-structure.md` says to test behaviour your app owns;
  this suite was asked for explicitly.
- Not planned, by decision: the list endpoint (`GET /api/users?page=2`) and
  invalid-payload POSTs (the mock accepts any body).
- **convention-check** has not been run on `tests/api/users.spec.ts`.
- The spec is a draft: nothing is committed, it has not been through PR review, and
  there is no CI.

## 2026-10-15 — Users API: convention check and reqres rate limit

`convention-check` on `tests/api/users.spec.ts`.

- **Result:** clean. Nothing must be fixed and nothing should be fixed. The locator,
  page-object and web-first-wait rules don't apply to an API spec. The
  `@playwright/test` import and missing `storageState` are covered by the `tests/api/`
  exemption in `PROJECT.md`.
- **Three style suggestions:**
  1. Move `baseURL` from the spec's `test.use` into the `api` project. **Applied:** the
     `api` project now sets `use: { baseURL: 'https://reqres.in' }`. The spec's
     `test.use` line is gone, and its header comment says the project sets the base
     URL. The `PROJECT.md` exemption now says API specs use relative paths and the
     `api` project supplies `baseURL`. (The Users API entry above still says the spec
     sets its own `baseURL`; that was true when it was written.)
  2. Merge the two `id` checks in the POST test. **Applied:**
     `expect(body.id).toEqual(expect.stringMatching(/\S/))`.
  3. Add the response body as the message on status checks, so a failure shows what
     came back. **Skipped by decision.**
- **Already known, not a finding:** the conventions say to test behaviour your own app
  owns, and reqres is a third party. The suite was asked for explicitly.

### reqres rate limit
- The first rerun after the fixes failed with **HTTP 429 Too Many Requests**: 3
  passed; on a retry-free rerun, 4 failed with 429.
- reqres caps anonymous use at **40 requests a day per IP**, resetting at midnight UTC.
  The free `reqres-free-v1` API key doesn't raise the cap. The 429 body says a free
  reqres account gives a higher limit and a personal key.
- A full run uses 6 requests. With the old global retry setting, a failing run could
  use up to 12 locally. So the suite can only run a few times a day from one machine,
  and CI would hit the cap.
- **Fixed:** the `api` project now has `retries: 0`, with a comment saying why. The
  browser projects keep the global setting (1 locally, 2 on CI).

### Verification
- The tests that passed on the rate-limited run used relative paths, so the
  project-level `baseURL` was applied. Without it they would have hit saucedemo.
- After the `retries: 0` change: `npx playwright test --list` shows 6 tests in the
  `api` project and 109 in total, unchanged.
- **2026-10-16, after the limit reset:** `npx playwright test --project=api`: **6
  passed in 1.2 seconds**, first try. This confirms the merged `id` check live.

### Still open
- The 40-request daily cap. The real fix is a reqres account with its own API key in
  `.env`, sent through the `api` project's `extraHTTPHeaders`. That needs the user to
  sign up.
- Nothing is committed. A convention check is a heuristic audit, not a test pass; the
  spec is still a draft awaiting PR review, and there is no CI.
