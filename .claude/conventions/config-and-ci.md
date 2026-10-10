# Config & CI — cross-browser, parallel, trace on failure

How the project *runs* the suite. These are set once in `playwright.config` and CI, not
per spec. `onboard` scaffolds a config that follows this — keep it in sync if you edit.

## Browsers
- Run on **Chromium, Firefox, and WebKit** — one `project` each in `playwright.config`.
  Cross-browser is where role-based locators earn their keep.
- Add a mobile project (`devices['Pixel 5']` / `['iPhone 14']`) if the app ships a
  responsive or mobile experience worth guarding.
- **Install the browsers for every configured project.** `npx playwright install` (no
  args) pulls down all of Chromium, Firefox, and WebKit — run it after adding a project,
  in CI setup, and on a fresh checkout. A project whose browser binary isn't installed
  fails the whole run with "Executable doesn't exist"; keep the installed browsers and the
  configured `projects` in lockstep.

## Parallelism & sharding
- Keep `fullyParallel: true`. Tests are independent (see `test-structure.md`), so they
  parallelize safely across workers.
- In CI, **shard** across machines for wall-clock speed (`--shard=1/4` … `--shard=4/4`)
  and merge the blob reports.

## CI config
- `forbidOnly: !!process.env.CI` — a stray `test.only` fails the build instead of
  silently shrinking the suite to one test.
- `retries: process.env.CI ? 2 : 0` — retry only in CI, to absorb infra flake; never to
  paper over a test that's actually flaky.
- `trace: 'on-first-retry'` — captures a trace exactly when something fails, free on
  green runs. Open it with `npx playwright show-trace`.
- HTML reporter locally; blob reporter when sharding.

## Run on CI on every PR
- The kit's trust model depends on it: a generated test earns trust through PR review
  **and several green CI runs**, never on creation. Wire `npx playwright test` into CI.
- `@smoke` is the fast per-PR slice; `@regression` is the nightly run (see
  `test-structure.md`).

## Lint the tests
- Run ESLint with `eslint-plugin-playwright` — it catches what review misses: a
  `test.only` left in, a floating promise (missing `await` on an assertion), an `expect`
  with no matcher.

## Keep current
- Update `@playwright/test` regularly, then `npx playwright init-agents --loop=claude` to
  regenerate the agents so they pick up new tools and instructions.

## Debugging tooling
- `npx playwright test --ui` — time-travel UI runner.
- `npx playwright show-trace` — open a trace from a CI failure.
- `npx playwright codegen <url>` — record a flow and discover locators.
