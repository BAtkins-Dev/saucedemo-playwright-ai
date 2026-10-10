---
name: convention-check
description: Audit a Playwright spec against the kit's conventions before a PR — flags brittle locators, manual waits, missing or weak assertions, and test-independence problems. Use when the user asks to review, check, or audit a .spec.ts file before opening a pull request.
---

# convention-check

Audit a spec against the house rules **before it goes to PR review**. This is a
read-and-report pass: you find problems and propose fixes, the human decides. It does
not replace PR review or green CI — it catches the obvious stuff first.

## Input

A spec file (e.g. `tests/checkout.spec.ts`). If the user names a feature but not a
file, find the spec under `tests/`. Audit one spec at a time.

## Load the rules, then read the spec

Read the conventions you're checking against so the audit is grounded in them, not
from memory:

- `.claude/conventions/locators.md`
- `.claude/conventions/test-structure.md`
- `.claude/conventions/assertions.md`
- `.claude/conventions/page-objects.md`
- `tests/seed.spec.ts` (the style baseline) and `PROJECT.md` (project specifics).

## Checklist

Go through the spec against each area. For every finding, cite the line and the rule.

**Locators** (`locators.md`)
- CSS/XPath/class selectors where a role/label locator would work.
- `nth(...)` / index-based selection instead of filtering by accessible name.
- Auto-generated selector chains left un-rewritten.
- Locators that look unverified against the live app.

**Assertions** (`assertions.md`)
- `page.waitForTimeout(...)`, sleeps, or polling loops — always a finding.
- Non-retrying reads (`expect(await ...textContent())`) instead of web-first matchers.
- Tests that act but never assert, or assert implementation detail over user-visible
  outcome.

**Structure & independence** (`test-structure.md`)
- Cross-test state coupling or reliance on execution order.
- `describe.serial` without a justifying comment.
- Setup copy-pasted across tests that should be a fixture.
- UI login on every test instead of a fixture/storageState.
- Missing `@smoke`/`@regression` tags; vague or non-behavioural test titles.
- File misplaced or covering more than one feature.

**Page objects** (`page-objects.md`)
- Thin wrappers that only rename a locator; assertions buried inside action methods.
- Inline complexity that should be abstracted (or abstraction that isn't earned).

## Report

Output a short, skimmable report grouped by area. Order findings by severity:

- 🔴 **Must fix** — will flake or break (manual waits, brittle locators, no assertion,
  cross-test coupling).
- 🟡 **Should fix** — convention drift (missing tags, weak titles, copy-paste setup).
- 🟢 **Nice to have** — style nits.

For each: the line reference, what's wrong, the rule it breaks, and the concrete fix.
End with a one-line verdict — clean, or what must change before PR — and a one-line
self-limit stated plainly in the output: *this is a heuristic audit, not a test pass; a
clean convention-check doesn't run the spec and doesn't replace PR review or green CI.*
**Don't auto-edit the spec** unless the user asks; propose the diff and let them apply it.
