# Users API — test plan
Source: pasted request ("create tests for post, get, get 404, put, patch, and delete;
assert on status code and response body"), with response shapes explored by calling
https://reqres.in/api/users on 2026-10-15

> **Input quality:** the request names the six calls and says to check status and body,
> but gives no contract. The status codes and fields below come from the live API, so
> they show what reqres returns today, not a spec. reqres is a public mock API: writes
> are echoed back but **not stored** (a created or updated user can't be read back), so
> these tests prove the response contract only, not that data changed.

Target spec: `tests/api/users.spec.ts`. Scope: the `/api/users` endpoints on reqres.in.
This is a separate third-party API, not part of saucedemo.

## Preconditions
- Auth: none. Every call below returned the same result with and without the
  `x-api-key` header on 2026-10-15, so the tests send no key. This is an API spec, so it
  uses Playwright's `request` fixture with no browser page and no `storageState`. The
  PROJECT.md "start from storageState" rule covers UI specs and does not apply here.
- Base URL: `https://reqres.in`, set for this spec only (`test.use({ baseURL })`), since
  the config's `baseURL` points at saucedemo.
- Data: none to seed. reqres serves fixed users (ids 1–12) and does not keep writes, so
  scenarios cannot affect each other.

## Scenarios

### Returns a single user by id @smoke
1. `GET /api/users/2`.

**Expected:** status **200**. Body `data` is `{ id: 2, email: "janet.weaver@reqres.in",
first_name: "Janet", last_name: "Weaver" }` and has an `avatar` URL.

### Returns 404 for a user that does not exist @regression
1. `GET /api/users/23`.

**Expected:** status **404**. Body is the empty object `{}`.

### Creates a user @smoke
1. `POST /api/users` with `{ "name": "morpheus", "job": "leader" }`.

**Expected:** status **201**. Body echoes `name: "morpheus"` and `job: "leader"`, and adds
a non-empty `id` (a string, e.g. `"840"`) and a `createdAt` ISO-8601 timestamp.

### Replaces a user with PUT @regression
1. `PUT /api/users/2` with `{ "name": "morpheus", "job": "zion resident" }`.

**Expected:** status **200**. Body echoes `name` and `job` and adds an `updatedAt`
ISO-8601 timestamp.

### Updates part of a user with PATCH @regression
1. `PATCH /api/users/2` with `{ "job": "zion resident" }`.

**Expected:** status **200**. Body echoes `job: "zion resident"`, adds an `updatedAt`
ISO-8601 timestamp, and has **no** `name` field (only the sent field comes back).

### Deletes a user @regression
1. `DELETE /api/users/2`.

**Expected:** status **204**, and the body is empty.

## Implementation notes for generate-tests
- Use the `request` fixture (`APIRequestContext`) directly. There's no page, so no page
  object. Import `test` / `expect` from `@playwright/test`: the project fixtures only
  add page objects, and pulling them in would imply a browser.
- Assert the fields that carry the contract (`toMatchObject` for the echoed fields,
  type/format checks for `id` and the timestamps). Do **not** assert the `support` or
  `_meta` blocks: they are reqres marketing copy that has changed before.
- PUT and PATCH have the same outcome shape but check different things (PATCH proves
  the absent `name`), so keep them as separate tests, not one data-driven test.

## Out of scope / open questions
- **Runs once per browser project.** The config runs every spec on chromium, firefox and
  webkit, and every browser project depends on `setup`, which signs in to saucedemo. An
  API spec gains nothing from three browsers. Options: an `api` project with
  `testMatch: /api\/.*\.spec\.ts/` and no setup dependency (with `testIgnore` for it on
  the browser projects), or accept 3× runs for now. **Your call. The plan doesn't
  change the config.**
- **API key may become required.** reqres has asked for an `x-api-key` header at times.
  It isn't enforced today. If tests start returning 401, add the header via
  `extraHTTPHeaders` from `.env`, not hard-coded.
- **List endpoint** (`GET /api/users?page=2`) and invalid-payload POSTs weren't requested.
  The mock accepts any body, so a validation test would only record mock behaviour.
- **Third-party dependency:** `test-structure.md` says to test behaviour your app owns.
  This suite tests an outside service, so it fails when reqres is down or changes. You
  asked for it explicitly; noted for reviewers.
