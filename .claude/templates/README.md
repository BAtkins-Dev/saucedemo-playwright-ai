# templates/

Kit-owned source for setup and updates. `onboard` materializes these into your repo's
real files. Edit the generated files, not these.

| Template | Materializes to |
|---|---|
| `CLAUDE.md.template` | `CLAUDE.md` |
| `PROJECT.md.template` | `PROJECT.md` |
| `seed.spec.ts.template` | `tests/seed.spec.ts` |
| `login.page.ts.template` | `tests/pages/login.page.ts` |
| `fixtures.index.ts.template` | `tests/fixtures/index.ts` |
| `mcp.json.template` | `.mcp.json` (tracker block, merged) |
| `env.example.template` | `.env.example` |
| `gitignore.template` | `.gitignore` |

`seed.spec.ts` + `login.page.ts` + `fixtures/index.ts` are the seed exemplar trio — they
compile and run together and demonstrate the validated readable shape (thin page object,
instantiate-only fixture, `.open()` in the spec). Keep them in sync.
