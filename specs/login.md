# Login — test plan
Source: explored https://www.saucedemo.com/ on 2026-10-09 (no ticket or written criteria)

> **Input quality:** this plan was drafted from the live site, not from a spec. It records
> what the login form does today, not what it is meant to do. The expected error copy
> below is observed behaviour — confirm it is intended before trusting these as tests.

Scope: the login form only (username, password, Login button, error banner). The page
header, the "Accepted usernames" credentials panel, and everything past the inventory page
are out of scope. Positive scenarios end as soon as the inventory page is reached.

## Preconditions
- Auth: none — every scenario starts logged out on the login page at `/`, opened
  explicitly in the spec (`loginPage.open()` in `beforeEach`). This spec is one of the two
  exceptions to the project's saved-login-state rule (see `PROJECT.md`): it must not use
  `storageState`, because logging in is what it tests.
- Data: none to seed. Uses the site's published accounts, all with password
  `secret_sauce`: `standard_user` (valid) and `locked_out_user` (locked).

## Scenarios

### Positive

#### Logs in with valid credentials @smoke
1. Enter username `standard_user`.
2. Enter password `secret_sauce`.
3. Click Login.

**Expected:** the browser lands on `/inventory.html` and the page title reads "Products".
The test ends here.

### Negative

All six negative scenarios have the same shape: submit the form, stay on the login page
(`/`), and see an error banner with specific copy. **Implement them as one data-driven
test** — one test body run over the table below, one `test()` per row — not six
hand-copied blocks. Each row stays a separately named, separately reported test.

| # | Scenario (test title) | Username | Password | Expected error (stable core) | Tag |
|---|---|---|---|---|---|
| 1 | Rejects an invalid password | `standard_user` | `wrong-password` | Username and password do not match any user in this service | @regression |
| 2 | Rejects an unknown username | `not_a_user` | `secret_sauce` | Username and password do not match any user in this service | @regression |
| 3 | Rejects a locked-out user | `locked_out_user` | `secret_sauce` | Sorry, this user has been locked out. | @regression |
| 4 | Requires a username | *(blank)* | `secret_sauce` | Username is required | @regression |
| 5 | Requires a password | `standard_user` | *(blank)* | Password is required | @regression |
| 6 | Requires both fields | *(blank)* | *(blank)* | Username is required | @regression |

Steps for every row:
1. Enter the row's username (leave empty if blank).
2. Enter the row's password (leave empty if blank).
3. Click Login.

**Expected:** the error banner shows the row's message, and the browser is still on the
login page (URL has not changed to `/inventory.html`).

Notes for the generator:
- The banner's full text is prefixed "Epic sadface: " — match on the stable core, as the
  seed does, not the full string.
- `tests/pages/login.page.ts` already exposes everything these scenarios need
  (`username`, `password`, `submit`, `error`, `signIn()`); no new page object is expected.

## Out of scope / open questions
- **Overlap with the seed.** `tests/seed.spec.ts` has "logs in with valid credentials"
  and "rejects an invalid password". Decided 2026-10-09: the seed file stays as the style
  exemplar, with those two tests marked `test.skip`; `tests/login.spec.ts` owns that
  coverage. The seed's logout test still runs.
- **Other published accounts** (`problem_user`, `performance_glitch_user`, `error_user`,
  `visual_user`) — not explored and deliberately not planned (decided 2026-10-09: one
  positive scenario is enough).
- **Row 6 (both blank)** is kept by decision (2026-10-09), although it proves only that
  the username check wins when both are missing.
- **Direct access to `/inventory.html` while logged out** — not explored (the exploration
  session was already authenticated). It is access control rather than the login form, so
  left out; worth its own scenario if you want the login gate proven.
- **Logout** — covered by the seed, out of scope here.
- Observed incidentals, deliberately not scenarios:
  - Pressing Enter in either field submits the form, same as clicking Login.
  - The error banner has a "Dismiss error" button — not exercised.
  - A second failed attempt replaces the banner's message with the new one.
  - Case sensitivity and whitespace trimming of credentials — not explored.
- **Intent to confirm:** unknown username and wrong password return the identical message
  (rows 1–2), while a locked account gets a distinct one (row 3), which reveals that the
  account exists. That is what the site does today; whether it is intended is unknown.
