---
name: generate-tests
description: Turn a test plan in specs/ into a Playwright spec in tests/ — driving Playwright's generator, styling output from tests/seed.spec.ts + conventions, and verifying every selector against the running app via the playwright-test MCP. Use when the user wants to generate, write, or draft the actual test code from a plan.
---

# generate-tests

Turn an approved plan (`specs/<feature>.md`) into a reviewable spec
(`tests/<feature>.spec.ts`). This is the explicit "now write the code" step that
follows **plan-tests**.

You draft; a human reviews. The output is a draft — it earns trust through PR review
and green CI, never on creation.

## Stay in the asked scope

If at any point you conclude the request is wrong, infeasible, doesn't make sense, already
satisfied by existing work, or that a materially different task would serve the user better
— stop before doing the different or broadened task. Summarize what you found, state your
reasoning and recommendation, and ask how to proceed. Scope is the user's call: proceed on
a substituted or expanded task only with explicit confirmation. This is a permission gate,
not a refusal — if the user confirms, do it; the recommendation is an option, never imposed.
This governs *what* task is done. Routine in-scope judgment calls (selector choice, test
structure, naming) are not gated here — surface those in the final review as usual.

## Before you start: version-drift check

The Playwright agents are generated against a specific `@playwright/test` version and
silently desync when it changes. Read the installed version (from
`node_modules/@playwright/test/package.json`) and compare it to
`.claude/agents-playwright-version` (written at onboard time). If they differ, **warn**
the user to re-run `npx playwright init-agents --loop=claude` before proceeding, and let
them decide — warn only, never auto-run it. If the marker file is absent (an older
setup), skip this check silently.

## 1. Inputs

- A plan in `specs/<feature>.md`. If the user names a feature but no plan exists yet,
  run **plan-tests** first (or ask for the source). Don't generate from thin air.
- Load the style and rules so output matches the house style:
  - `tests/seed.spec.ts` — imports, fixtures, structure, naming to imitate.
  - `PROJECT.md` — base URL, auth approach, where tests live.
  - `.claude/conventions/` — `locators.md`, `assertions.md`, `test-structure.md`,
    `page-objects.md`.

## 2. Generate

Drive Playwright's **generator** agent to produce the spec from the plan. As it goes:

- **Verify selectors live.** Use the **`playwright-test` MCP** (`mcp__playwright-test__*`)
  to confirm every locator resolves to exactly one element on the running app. A selector
  is a guess until proven — see `locators.md`. Fix ambiguity by scoping, never by falling
  back to CSS/XPath.
- **Verify assertion targets too, not just action targets.** Resolve the target of every
  assertion live via the MCP before committing it — error banners, empty/loading states,
  and count/visibility assertions especially. When the MCP resolves an element to a stable
  selector, carry that selector into the spec instead of re-deriving a text-based locator.
  This catches strict-mode and wrong-assumption failures before the run, cutting
  run-fail-fix cycles.
- **Match the seed.** Same import style, fixtures, and structure as `tests/seed.spec.ts`.
- **Apply the conventions as you write**, not as a cleanup pass: role-first locators,
  web-first assertions (no `waitForTimeout`), one feature per file, independent tests,
  behavioural titles, `@smoke`/`@regression` tags.
- **One page object per page reached, not just the page a test starts on.** When a plan
  scenario's steps land on a different page (a redirect after submit, a confirmation
  screen, a dashboard), check whether a page object for *that* page already exists
  before writing locators for it — create one (`tests/pages/<page>.page.ts` + a fixture
  block) rather than adding fields for it to the page object the flow started from. See
  `page-objects.md`'s "one page object per page" rule for the failure mode this avoids.
- **One scenario → one `test`, unless the plan says otherwise.** Keep the mapping from
  plan to spec obvious. When the plan groups several scenarios as data-driven (same
  assertion shape, different inputs — see `plan-tests`), implement them as one test body
  run over a small data table: a `for (const case of cases) { test(...) }` loop that
  still emits one `test()` per row (Playwright's own parameterization pattern), not one
  `test` with a manual loop of assertions inside it. Each row still needs to show up as
  its own result in the test report — that's what keeps the coverage visible, not just
  the code DRY.

Write to `tests/<feature>.spec.ts`.

## 3. Prove it runs, then hand off

- Run the spec (see `PROJECT.md` for the command, e.g.
  `npx playwright test tests/<feature>.spec.ts`). Report pass/fail honestly — if it
  fails, show the output and fix or flag it; don't claim green when it isn't.
- Suggest **convention-check** on the new spec before the user opens a PR.
- Remind the user this is a draft for human review.

If a later run breaks on changed locators, that's the **healer's** job — point them to
`Run the healer on tests/<feature>.spec.ts`.
