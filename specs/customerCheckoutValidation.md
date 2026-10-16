# Customer checkout validation — test plan
Source: pasted brief (data-driven, JSON-backed validation of First Name, Last Name and
Zip/Postal Code on `/checkout-step-one.html`; stop after Continue) + explored
https://www.saucedemo.com/checkout-step-one.html on 2026-10-15

> **Input quality:** the brief sets the scope, the fields and the JSON data source, but
> not the rules. The rules and error messages below come from the live site, so they show
> what the form does today, not what is intended. Confirm them before trusting these as
> tests. In particular, nothing says whether whitespace-only input or any postal-code
> format should be rejected (see open questions).

Scope: the "Checkout: Your Information" form only. Fill the three fields, click
"Continue", check where the user ends up. Login, adding to cart, the cart's Checkout
button and everything after Continue (overview, Finish) are covered by other specs and
are not repeated. `specs/checkout.md` left this validation out by decision; this plan is
where it now lives.

## Preconditions
- Auth: every scenario starts already signed in as `standard_user` from the saved
  `storageState` (`test.use({ storageState: STANDARD_USER_STATE })`), per `PROJECT.md`.
  No test types credentials.
- Arriving at the page: the spec gets the existing `checkoutInformationPage` fixture and
  calls its `.open()` in `beforeEach`, which goes straight to `/checkout-step-one.html`.
  Checked live: a signed-in user with an empty cart can open the page directly, so no
  test adds items or clicks through the cart. The fixture only constructs the page
  object; navigation stays visible in the spec, per `test-structure.md` (see open
  questions).
- Data: `checkoutValidation.json`, read by the spec. Planned location
  `tests/data/checkoutValidation.json`. It has two lists, because the two outcomes need
  different checks:
  - `accepted`: rows that should reach the overview.
  - `rejected`: rows that should stay on the form, each with its expected error.

  Each row has a `title` (used as the test name), `firstName`, `lastName`,
  `postalCode`, and for rejected rows an `error`. A rejected row may also carry
  `knownFailure`, a short reason; the spec marks that row `test.fail` with it.

## Scenarios

All five come from the JSON. Generate them as **two data-driven test bodies**, one per
list, each looping over its rows so that every row is reported as its own `test()`.

### Accepted

#### Continues to the overview with all fields filled @smoke
Row: Ada / Lovelace / 12345
1. Open the information page.
2. Enter the first name, last name and postal code, and click "Continue".

**Expected:** the page is `/checkout-step-two.html` with the title "Checkout: Overview".

### Rejected

Same steps for every row: open the information page, enter the row's values (blank means
left empty), click "Continue".

**Expected for every row:** the page stays on `/checkout-step-one.html`, and the error
banner shows the row's error. Match the stable core of the message, without the
"Error: " prefix.

| Scenario | First Name | Last Name | Zip/Postal Code | Error (today's copy) |
|---|---|---|---|---|
| Requires a first name @regression | *(blank)* | Lovelace | 12345 | First Name is required |
| Requires a last name @regression | Ada | *(blank)* | 12345 | Last Name is required |
| Requires a postal code @regression | Ada | Lovelace | *(blank)* | Postal Code is required |
| Rejects whitespace-only values @regression — **known failure** | 3 spaces | 3 spaces | 3 spaces | First Name is required |

**Known failure (decided 2026-10-15):** today the whitespace-only row goes through to the
overview. The row is marked `test.fail`: the run stays green while the defect exists,
and it reports as unexpectedly passing if the site starts rejecting whitespace. The
expected error is an *assumed* intent: whitespace counts as blank, and the first field
wins as it does for blanks. `test.fail` is green on any failure, so the report should
show it failing on the URL or banner check, not on an earlier line.

## Decisions (2026-10-15)
- **Arriving at the page:** follow the house rule. Use the auth fixture
  (`storageState`) and the page-object fixture, and call `.open()` in the spec.
  Fixtures do not navigate.
- **Whitespace-only values:** a `rejected` row marked as a known failure (above).
- **Postal code:** check only that the field has data, regardless of format. No format
  rows for now; `abc` and `1` are accepted today and that is fine.

## Out of scope / open questions
- **Several blank fields.** The first missing field wins, in form order. All blank gives
  "First Name is required", and blank last name and postal code gives "Last Name is
  required". This is incidental ordering, not planned. Rows can be added to the JSON
  later at no code cost.
- **Every input is marked as an error** on any rejection, not just the empty one. This is
  a styling detail and is not asserted.
- Not explored: the banner's dismiss button, Cancel (covered by `tests/checkout.spec.ts`),
  and the other published accounts.
