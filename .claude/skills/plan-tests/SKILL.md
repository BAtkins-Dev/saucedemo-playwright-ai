---
name: plan-tests
description: Turn a source of truth — a ticket (Jira/Linear/GitHub), pasted acceptance criteria, a PRD/user story, or a live URL to explore — into a readable Playwright test plan in specs/, then hand off to the generator. Use when the user wants to plan or draft tests for a feature, issue, or page.
---

# plan-tests

Turn whatever the user has into a **readable test plan** that Playwright's generator
can build from. Works from several kinds of input — use the strongest one available.

You draft; a human reviews. Never present a plan or generated test as trusted.

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

## 1. Identify the source

Take whatever the user gives. In rough order of how good the input is:

1. **Ticket** — a Jira/Linear/GitHub issue key. If the matching tracker MCP is wired,
   pull the issue (summary, description, acceptance criteria). If not, say so and ask
   the user to paste it. Check `PROJECT.md` for the configured source.
2. **Pasted acceptance criteria / user story / PRD** — use as-is.
3. **A URL to explore** — when there's no written spec, drive the live app via the
   **`playwright-test` MCP** (`mcp__playwright-test__*`) to discover the flow, then plan
   from what you observe.

**Be honest about input quality.** A ticket or criteria describes *intended* behavior,
including edge cases and error paths that may not be built yet — that's the best
source. Exploring a URL only captures *what currently exists*, so it can bake in
present-day behavior (bugs included) and miss anything specified-but-unbuilt. When you
plan from a URL, say so in the plan and flag where you'd want the user to confirm intent.

## 2. Read the context before planning

So the plan fits the project (don't skip — a plan is only as good as its constraints):

- `PROJECT.md` — URLs, auth, ticket source, where plans/tests live.
- `tests/seed.spec.ts` — the style every generated spec imitates.
- The relevant `.claude/conventions/` files — at minimum `test-structure.md` and
  `locators.md`.

## 3. Write the plan to `specs/<feature>.md`

Produce a **human-readable plan**, not test code. One file per feature, named for it.
Each scenario maps to a future `test`. Structure:

```markdown
# <Feature> — test plan
Source: <PROJ-1234 / pasted criteria / explored https://… on 2026-06-19>

## Preconditions
- Auth: <how the test arrives logged in — fixture / storageState / UI login>
- Data: <records or state that must exist; prefer API/fixture setup>

## Scenarios
### <behaviour, present tense> @smoke
1. <user-visible step>
2. <user-visible step>
**Expected:** <observable outcome to assert>

### <next behaviour>
...

## Out of scope / open questions
- <ambiguities, or — for URL-explored plans — behaviour to confirm against intent>
```

Rules for a good plan:

- **Cover the criteria** — happy path plus the error/edge cases implied. Note coverage
  gaps instead of papering over them.
- **Tag scenarios** (`@smoke` / `@regression`) per `test-structure.md`.
- **Steps are user actions and observable outcomes**, not locators or code.
- **Each scenario is independent** — none depends on a previous scenario's state.

### Bias toward fewer, higher-value scenarios — but don't over-correct

Every scenario runs on every browser, every PR, forever. Treat that as a real cost, not
a free byproduct of "being thorough" — a plan isn't better for enumerating every input
permutation you can think of. But cutting too hard is its own failure mode: dropping
standard validation coverage to hit a small number is not "high value," it's just a
different wrong answer. Aim for the smallest plan that still covers every *category* of
behavior a user or reviewer would expect proven, not the smallest plan, period.

**Two different things get called "edge cases" — tell them apart:**

- **Standard negative-path baseline → default IN.** For any form: does the happy path
  work, does each documented/implied error path reject correctly, and is each required
  field actually enforced (submitting blank is *not* the same check as submitting a
  wrong value — one proves "field must not equal X", the other proves "field must be
  present" — both are standard, expected coverage for a form, not a stretch case).
- **True incidental behavior → default OUT** unless the source of truth calls it out:
  whether a match happens to be case-sensitive, whether whitespace gets trimmed, which
  of two invalid fields wins when both are wrong, whether an error message updates on a
  second attempt. These are implementation quirks a user journey doesn't depend on —
  explore and note them, but they don't default into the suite.

**Keep near-duplicate-shaped scenarios, don't delete them — consolidate them.** Several
scenarios that assert the same *shape* of outcome from different inputs (e.g. "invalid
username", "missing username", "invalid password", "missing password" — all "stays on
the form, shows this exact error") are exactly what a **data-driven test** is for: one
plan entry each (so the coverage stays visible and reviewable), but tell
`generate-tests` to implement them as one test body run over a small data table (a
`for` row → one `test()` per case), not four hand-copied test blocks. This keeps
authoring and maintenance cheap while keeping full scenario coverage — resist the urge
to solve "too many near-identical tests" by deleting the coverage instead of DRYing the
code.

- **When exploring a URL turns up true incidentals beyond the baseline**, still write
  them down — put them under "Out of scope / open questions" with a one-line reason,
  instead of turning each into a `## Scenario`. That keeps the exploration honest
  without bloating the suite.
- **Before finalizing a plan that cuts a substantial chunk of what you explored**
  (roughly: you're dropping half or more of the scenarios you found), show the user the
  proposed keep/cut split and your reasoning for each cut, rather than deciding silently.
  Pruning aggressiveness is a judgment call people disagree on — a quick sanity check up
  front is cheaper than a review-round correction later.
- **This is a default, not a ban.** A ticket or PRD that explicitly calls out an edge
  case (accessibility requirement, a known past incident, a compliance rule) earns a
  scenario regardless of how small it looks — the source of truth overrides this bias.

## 4. Confirm, then hand off

Show the plan and let the user skim it. When they're happy, hand off to **generate-tests**
to turn `specs/<feature>.md` into `tests/<feature>.spec.ts`. (Generate-tests styles it
from `tests/seed.spec.ts` + conventions and verifies selectors live via the `playwright-test` MCP.)
