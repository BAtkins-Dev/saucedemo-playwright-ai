# Locators — role-first

How we find elements. The goal is locators that survive markup churn and read like
the thing a user actually does. Resilience comes from querying the *accessibility
tree*, not the DOM structure.

## Priority order

Reach for the first one that fits. Drop down the list only when the one above
genuinely doesn't work.

1. **`getByRole(role, { name })`** — the default for anything interactive
   (buttons, links, headings, checkboxes, tabs, menu items). Mirrors how the user
   and assistive tech perceive the page.
2. **`getByLabel(text)`** — form fields with an associated `<label>`.
3. **`getByPlaceholder(text)`** — inputs that have only a placeholder, no label.
4. **`getByText(text)`** — non-interactive copy (a paragraph, a status line).
5. **`getByTestId(id)`** — escape hatch. Only when nothing accessible identifies
   the element, and prefer adding a real label/role to the app over reaching here.

CSS and XPath are a last resort. If a CSS selector is the only thing that works,
that's usually a signal the app has an accessibility gap worth a ticket.

```ts
// Good — reads like user intent, ties to the accessibility tree
await page.getByRole('button', { name: 'Add to cart' }).click();
await page.getByLabel('Email').fill('ada@example.com');
await expect(page.getByRole('heading', { name: 'Order confirmed' })).toBeVisible();

// Avoid — brittle, coupled to markup and styling
await page.locator('.btn.btn-primary.add-cart').click();
await page.locator('//div[2]/form/input[1]').fill('ada@example.com');
await page.locator('#root > div > main > h1').click();
```

## Rules

- **Prefer accessible names over `nth`/index.** `getByRole('row').nth(3)` breaks the
  moment a row is inserted. Filter by content instead.
- **Scope, don't guess.** When a name appears more than once, narrow with a
  container rather than reaching for an index:
  ```ts
  const row = page.getByRole('row', { name: 'Invoice #1024' });
  await row.getByRole('button', { name: 'Download' }).click();
  ```
  `getByRole(...).filter({ hasText })` and `.and()` are also fair game.
- **Match what the user sees.** Use the visible name, not an internal id or class.
- **No auto-generated locators left raw.** The MCP/codegen may emit a CSS chain;
  rewrite it role-first before it lands in a spec.
- **One locator, one concept.** Assign reused locators to a `const` with a name that
  says what it is (`const saveButton = ...`), don't repeat the chain.
- **Tables: address cells by column, not position.** Reach a cell through a stable
  column anchor — a `data-col` attribute on the cell, or the column's header — rather than
  `td.nth(i)`. Column order changes; `nth` silently reads the wrong column when it does.
  Scope the lookup to the row, e.g. a `cell(column)` accessor on the page object:
  ```ts
  // body cells expose data-col="id|course|language|level|enrollments"
  cell(column: string) {
    return this.rows.locator(`td[data-col="${column}"]`);
  }
  // in the spec
  await expect(coursesTable.cell('language')).toHaveText('Python');
  ```
  If the app has no per-cell hook, derive the column index from the header row by its
  accessible name once, rather than hard-coding `nth` throughout the spec — and consider a
  ticket to add `data-col`.

## Verify before you commit

Selectors are guesses until proven against the running app. Drive the live app via
the **`playwright-test` MCP** (`mcp__playwright-test__*`, installed by init-agents) and
confirm each locator resolves to exactly one element before it goes in a spec. Ambiguous matches (`strict mode violation`) get fixed by
scoping, never by switching to a brittle CSS path. See `PROJECT.md` for the base URL.
