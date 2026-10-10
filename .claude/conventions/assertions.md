# Assertions — web-first, no manual waits

Assert on observable state, and let Playwright do the waiting. Web-first assertions
auto-retry until the condition holds or times out, which removes almost every reason
a test would otherwise flake.

## Use web-first (auto-retrying) assertions

`expect(locator)` matchers poll the page for you. Prefer them everywhere.

```ts
// Good — retries until true, fails with a clear timeout if it never is
await expect(page.getByRole('status')).toHaveText('Saved');
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
await expect(page.getByRole('listitem')).toHaveCount(3);
await expect(page).toHaveURL(/\/orders\/\d+/);

// Avoid — reads state once, no retry, races the UI
expect(await page.getByRole('status').textContent()).toBe('Saved');
```

Common matchers: `toBeVisible`, `toBeHidden`, `toHaveText`, `toContainText`,
`toHaveValue`, `toBeEnabled`/`toBeDisabled`, `toBeChecked`, `toHaveCount`,
`toHaveURL`, `toHaveAttribute`.

## Verify the assertion target live before committing it

Resolve every assertion's target against the running app via the `playwright-test` MCP
(`mcp__playwright-test__*`) before you commit the assertion — not just the action targets
(click/type), but the assertion targets too: error banners, empty/loading states, and
count/visibility assertions especially. When the MCP resolves an element to a stable
selector during verification, carry that selector into the spec rather than re-deriving a
text-based locator. This catches strict-mode and wrong-assumption failures before the run,
cutting run-fail-fix cycles.

## Never hand-roll waits

- **No `page.waitForTimeout(...)`.** A fixed sleep is either too short (flaky) or too
  long (slow), and always wrong. There is no acceptable value.
- **No polling loops or arbitrary `setTimeout`.**
- If you need to wait for something, wait for the *thing*: a visible element, a URL,
  a response. `await expect(...)` or `page.waitForResponse(...)` — not the clock.

```ts
// Bad
await page.getByRole('button', { name: 'Load' }).click();
await page.waitForTimeout(2000);
await expect(page.getByRole('row')).toHaveCount(10);

// Good — the assertion itself waits for the rows to arrive
await page.getByRole('button', { name: 'Load' }).click();
await expect(page.getByRole('row')).toHaveCount(10);
```

## Assert what the user perceives

- Check **visible outcomes** (text, counts, enabled state, URL), not implementation
  detail (a CSS class, an internal data attribute, a network call's raw shape) unless
  that's genuinely the contract under test.
- **Every test ends in at least one assertion.** A test that only clicks proves
  nothing — assert the outcome that makes the action meaningful.
- Prefer one clear assertion of the real outcome over a pile of incidental ones.
- Use **soft assertions** (`expect.soft`) only when you deliberately want to collect
  several independent failures in one run; otherwise let the first failure stop.

## Make the assertion durable — match what's stable

Tie each assertion to the most stable thing that still proves the outcome.

- **Human-facing copy → loosen it.** Use a regex or `toContainText` for text that
  product/marketing may reword, so a comma or tense change doesn't fail the suite:
  ```ts
  await expect(page.getByRole('status')).toContainText(/saved/i);
  ```
- **Ids, counts, and structured values → match exactly.** Element ids, numeric values,
  enumerated states, and URLs are contracts, not prose — assert them with `toHaveText`,
  `toHaveValue`, `toHaveCount`, exact `toHaveURL`. Anchor the *target* on a stable
  `#id`/role (see `locators.md`), not on the copy you're checking.
- Match the strictness to what would legitimately change: don't pin exact wording you
  don't own, and don't loosen a value that's part of the contract.

## `toBeVisible` is opacity-blind — assert real visibility on animated elements

`toBeVisible()` passes for an element that is laid out and not `display:none` /
`visibility:hidden` / zero-size — but it **ignores `opacity`**. A confirmation banner
that sits at `opacity:0` and fades in on a real save is already "visible" to
`toBeVisible()` *before* anything happens, so that assertion proves nothing.

On faded / animated elements, assert the outcome the user actually perceives:

```ts
// Bad — passes even while the banner is fully transparent
await expect(confirmation).toBeVisible();

// Good — proves it genuinely showed: real content AND fully opaque
await expect(confirmation).toHaveText('Row 2 was saved');
await expect(confirmation).toHaveCSS('opacity', '1');
```

`toHaveText`/`toContainText` already wait for the shown content; pair with an explicit
`toHaveCSS('opacity', '1')` when an element is animated and visibility is the thing under
test.

## An assertion that can't fail isn't one

Before calling a test done, ask what state would make each assertion red. If nothing
would, it's dead. The usual cause: the page already satisfies the assertion before the
user action runs — an element that's already present, a field already holding the
expected value, a count that happens to match.

Check it the cheap way — run the assertions *without* the user action. Anything still
green is testing the page's resting state, not your flow. Where that resting state
matters, commit a test that asserts it, so the suite fails if the app ever ships the
post-action state by default.

Force failures by changing the **app's** state, never by editing the expected value —
that only proves the matcher runs.
