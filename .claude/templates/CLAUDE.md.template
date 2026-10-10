# Playwright AI Kit — House Rules

This repo uses Playwright's built-in Test Agents (planner / generator / healer) to
draft end-to-end tests. Your job is to make their output follow our conventions and
start from a clear source of truth. **You draft; a human reviews.**

## Always
- Start from the best source available — a ticket, acceptance criteria, or a PRD.
  Exploring a live URL is supported when that's all there is, but treat it as the
  weaker input: it captures what exists today, not what's intended.
- Imitate `tests/seed.spec.ts`. It is the canonical style example: match its imports,
  fixtures, structure, and naming.
- Verify selectors against the running app via the `playwright-test` MCP
  (`mcp__playwright-test__*`, installed by init-agents) before committing them.
- Produce drafts for human review. Never treat a generated test as trusted; it earns
  trust through PR review and green CI runs.
- After the healer fixes a test, re-review it for intent before trusting it. A heal only
  makes the run green again; it can mask a real regression by quietly accepting changed
  behaviour. A green heal is not a verified test.
- Do the task as asked. If you conclude it's wrong, infeasible, already done, or that a
  materially different task would serve better, stop and ask before changing scope — don't
  silently substitute, expand, or redirect it.

## Conventions (load on demand)
The detailed rules live in `.claude/conventions/`. Read the relevant file before
writing or auditing a spec:
- `.claude/conventions/locators.md` — role-first locator strategy
- `.claude/conventions/test-structure.md` — fixtures, independence, tagging, layout
- `.claude/conventions/assertions.md` — web-first assertions, no manual waits
- `.claude/conventions/page-objects.md` — when to abstract, when not to
- `.claude/conventions/config-and-ci.md` — cross-browser, parallel, retries/trace, CI

## Project specifics
See `PROJECT.md` for the base URL, the test command, and where tickets live.

## Skills
- `onboard` — set the kit up in a new or existing repo (detect, ask, configure).
- `plan-tests` — turn a ticket / criteria / PRD / explored URL into a Playwright plan.
- `generate-tests` — turn a plan in `specs/` into a spec in `tests/`.
- `convention-check` — audit a spec against our conventions before a PR.

Keep this file short. Anything detailed or situational belongs in `conventions/`.
