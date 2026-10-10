---
name: onboard
description: Set up the Playwright AI Kit in this repo — works for a brand-new project or an existing Playwright one. Detects what's already here, asks a few questions, then (with your OK) installs Playwright and runs init-agents, and materializes the kit's files (CLAUDE.md, PROJECT.md, the seed exemplar trio tests/seed.spec.ts + tests/pages/login.page.ts + tests/fixtures/index.ts, .env, .gitignore, plus an optional tracker in .mcp.json) by MERGING into anything that already exists. Use when the user wants to set up, configure, initialize, or get started with the kit.
---

# onboard

Get the kit working in this repo with one guided pass. The repo might be a **brand-new
project** or an **existing Playwright / frontend project** — detect which, and adapt.
Never assume.

This skill is also what makes the kit **conflict-safe**. The user only copies the
`.claude/` folder into their repo; the generated files (CLAUDE.md, PROJECT.md, the seed
trio tests/seed.spec.ts + tests/pages/login.page.ts + tests/fixtures/index.ts, .mcp.json,
.env.example, .gitignore) are **not** shipped as droppable files — they live as sources
under `.claude/templates/*.template`, and *you* create or merge them here so nothing the
user already has gets clobbered.

**Golden rule: be non-destructive.** Detect first, fill only the gaps, and never
overwrite an existing file without showing the user the change and getting an explicit
yes. For an existing project the default posture is "add what's missing, merge into
what's there, touch nothing that works."

## 1. Detect the current state (read-only)

Before asking anything, look at the repo and build a picture:

- `package.json` present? → existing Node project (read its scripts, deps).
- `@playwright/test` in dependencies? → Playwright already installed.
- `playwright.config.{ts,js,mjs}` present? → already configured (note its `baseURL`
  and `testDir`).
- `tests/` and `specs/` directories present?
- `.claude/agents/` present? → Playwright test agents already generated.
- Existing **files that need merge, not overwrite**: `CLAUDE.md`, `.mcp.json`,
  `.gitignore`, `.env.example`, `PROJECT.md`, `tests/seed.spec.ts`,
  `tests/fixtures/index.ts`, `tests/pages/*.page.ts`.
- Lockfile (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`) → infer package manager.
- TS vs JS (tsconfig, existing spec extensions).
- `.env` present? (Never read or print its contents — just note existence.)
- **Stray kit files** — the README says copy `.claude/` *only*, but people often clone
  the whole kit repo. Check, don't assume: if root `README.md` is the kit's own (starts
  with `# Playwright AI Kit — Claude Code Edition`) or `.gitignore` begins with
  `# Kit source repo — own hygiene.` (or contains "Kit source repo"), those are the
  kit's files, not the user's. Verify by content marker before judging.

Summarize what you found in one or two lines ("Existing TS frontend repo with its own
CLAUDE.md and .gitignore, no Playwright yet") so the user can correct you.

**If you found stray kit files, flag it now and offer to remove them.** They'll collide
with the user's real `README.md`/`.gitignore`. List exactly which files you believe are
the kit's (by the markers above) and offer to delete just those — confirm first, and
never touch a file whose content looks like the user's own.

## 2. Ask what you can't detect

Ask in a small batch (use the question tool). Skip anything detection already answered;
offer the kit defaults so the user can just accept them. Cover:

- **App URL(s) per environment** — at least local; staging/prod optional.
- **Auth for tests** — UI login / saved `storageState` / API setup / none. (Drives how
  the seed and fixtures should log in; see `.claude/conventions/test-structure.md`.)
- **Ticket source** — Jira / Linear / GitHub Issues / other tracker / paste-only.
- **Language & package manager** — confirm the detected TS/JS + npm/pnpm/yarn.
- **CI** — GitHub Actions / other / none (optional).
- **Conventions** — accept the kit defaults in `.claude/conventions/`, or note tweaks
  (locator priority, tagging scheme) to apply after.

## 3. Act — gated, gap-filling, in this order

Show the plan, then do each step. **Confirm before any install, and before writing any
file that already exists.** The template sources live in `.claude/templates/`.

**Install (only if missing, and only with a yes) — run this block FIRST, before the
merge steps below, because `init-agents` writes files they build on:**
- `npm i -D @playwright/test` (or pnpm/yarn equivalent) — skip if already a dep.
- `npx playwright install` — browsers, if not present.
- `npx playwright init-agents --loop=claude` — generates `.claude/agents/`
  (planner/generator/healer). Skip if `.claude/agents/` already exists. **This is the
  source of truth for the browser MCP and the seed path:** it writes `.mcp.json` with
  Playwright's official `playwright-test` server (`run-test-mcp-server`, which the agents
  call as `mcp__playwright-test__*`) and scaffolds `tests/seed.spec.ts`/`specs/`. The
  `.mcp.json` and seed steps below **merge into / reconcile with** what it wrote — never
  clobber it, and never add a second browser MCP.
- **Record the Playwright version the agents were generated against.** Right after
  `init-agents` succeeds, read the installed `@playwright/test` version from
  `node_modules/@playwright/test/package.json` and write it (a single line) to
  `.claude/agents-playwright-version`. Commit it — don't gitignore it — so `plan-tests`
  and `generate-tests` can detect drift after a Playwright upgrade. Rewrite this file
  whenever you re-run `init-agents`.

**Scaffold (only if missing — never overwrite):**
- `playwright.config.{ts,js}` — **only when none exists**, scaffold this exact shape (per
  `.claude/conventions/config-and-ci.md`):
  - `testDir: './tests'`
  - `baseURL` (under `use`) from **PROJECT.md** — so the seed's relative `page.goto('/…')`
    calls resolve.
  - exactly **three projects**: Chromium, Firefox, WebKit (`devices['Desktop Chrome' /
    'Desktop Firefox' / 'Desktop Safari']`).
  - `fullyParallel: true`.
  - **CI-only** hardening: `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 :
    0`, `use.trace: 'on-first-retry'`.
  - **No reporters and no explicit timeouts** unless the project actually needs them —
    keep the scaffold minimal and let the project add them deliberately (the fuller
    reporter/sharding setup is documented in `config-and-ci.md`).

  If one exists, leave it and just confirm its `baseURL`/`testDir` make sense (flag if not).
- `tests/` and `specs/` directories.

**Materialize / merge the kit's files** — for each, the rule is *create if absent, merge
if present, never blind-overwrite*:

- **`CLAUDE.md`** ← `templates/CLAUDE.md.template`. If none exists, write it. If one
  exists, **append** the kit's house-rules section (or add an `@.claude/...` import line)
  rather than replacing the user's instructions. Show the addition first.
- **`PROJECT.md`** ← `templates/PROJECT.md.template`, filled from the answers. If it
  exists and is customized, show a diff and confirm.
- **The seed exemplar — three files that compile and run together.** The seed now
  demonstrates the validated shape (thin page object + instantiate-only fixture + spec),
  so materialize all three, create-if-absent / merge-don't-clobber like everything else:
  - **`tests/seed.spec.ts`** ← `templates/seed.spec.ts.template`. Always lives at
    `tests/seed.spec.ts` — the exact path the agents reference (`// seed: tests/seed.spec.ts`).
    It imports `test`/`expect` from `./fixtures` and drives the page object. `init-agents`
    will have scaffolded a stub there; the kit's template is the richer exemplar, so
    **reconcile**: offer to replace the stub with it (confirm first), or merge. Do **not**
    create a competing root-level seed.
  - **`tests/pages/login.page.ts`** ← `templates/login.page.ts.template`. The seed's one
    thin page object (named locators + intent methods, no assertions). The fixture imports
    `LoginPage` from here, so it must exist for the seed to compile.
  - **`tests/fixtures/index.ts`** ← `templates/fixtures.index.ts.template`. The
    instantiate-only fixture that hands the spec a `LoginPage`. If a `tests/fixtures/index.ts`
    already exists, **merge** the new fixture block in rather than overwriting the user's
    fixtures.

  Offer to adapt the page object's login flow and the config `baseURL` to the chosen auth
  method and URL so the trio is green out of the gate.
- **`.mcp.json`** — already created by `init-agents` with the `playwright-test` server.
  **Do not add a browser MCP** — that server *is* the browser MCP, and a second one is a
  dead server. Only if the user chose a tracker, **merge** its server block (from
  `templates/mcp.json.template`) into the existing `.mcp.json`, never dropping the
  `playwright-test` server or anything else already there. For paste-only, leave
  `.mcp.json` exactly as `init-agents` wrote it.
- **`.env.example`** ← `templates/env.example.template`. If a tracker was chosen,
  **append** the tracker vars to the existing `.env.example` (or create one). Then, if
  the user wants, copy needed keys into `.env` as placeholders — **never overwrite an
  existing `.env`**, never write real secrets.
- **`.gitignore`** ← `templates/gitignore.template`. **Append** only the lines the
  existing `.gitignore` is missing (notably `.env`, `auth/`, Playwright artifacts, and
  `.claude/settings.local.json`). Create one if absent. Confirm `.env` ends up ignored.

## 4. Wrap up

Report what was created, what was merged, what was skipped, and what's still on the user
(e.g. "filled `JIRA_API_TOKEN` placeholder in `.env` — add the real token", "verify
`baseURL`"). Then close out with these two steps — don't skip them:

**(a) Check the seed is the kit's exemplar, then run it green.** The `init-agents` stub
(`test('seed', …)` with `// generate code here.`) passes in under 100ms — a green run
does **not** prove the exemplar landed. No `expect()` in the file means the reconcile
step above was skipped; go back and do it. Its whole value is being a *working*
exemplar the generator imitates; an unproven seed teaches bad style. After adapting it to
the chosen auth and `baseURL`, run it:

```
npx playwright test tests/seed.spec.ts
```

Report pass/fail honestly. If it's red, fix or flag it before moving on — don't leave a
broken example in place.

**(b) Tell the user to reload Claude Code before plan-tests / generate-tests.** `.mcp.json`
is read only at startup, so the session you onboarded in has **no** `mcp__playwright-test__*`
browser tools yet — `plan-tests` (URL exploration) and `generate-tests` (live selector
verification) will fail if run right now. Warn explicitly: **restart Claude Code first**,
then:

> Ready — **reload Claude Code first** (the browser MCP activates on restart). Then try:
> **"plan-tests for PROJ-1234"** (or paste acceptance criteria, or give a URL to explore),
> then **generate-tests** to draft the spec.

Remind them once: the kit drafts, a human reviews. Generated tests earn trust through
PR review and green CI, not on creation.
