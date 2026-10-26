# CLAUDE.md

Instructions for coding agents working in this repository. `AGENTS.md` points here, so every agent
reads the same rules. Read `ARCHITECTURE.md` before changing anything under `server/` or `domain/`.

## The project

The website for E&T-dagene, a career fair run by students at NTNU: companies, events with
registration, job listings, résumés and an admin panel. Nuxt 3 with server-side rendering, a Nitro
API under `server/api`, Firebase Auth, Realtime Database and Cloud Storage. Bun is the package
manager and script runner; Node 22 runs production.

## Commands

```sh
bun install            # also runs `nuxt prepare`
bun run dev            # dev server, reads .env.development
bun run lint           # eslint + prettier check; `bun run lintfix` fixes most of it
bun run typecheck      # tsc on .ts files; must pass
bun run typecheck:full # includes Vue SFCs; CI compares its error count to a baseline
bun run test           # vitest, tests/**/*.{test,spec}.ts
bun run test:api       # API tests against the Firebase emulators; needs Java 21 and a build
bun run build          # production build
```

Before opening a pull request, run `lint`, `typecheck`, `test` and `build`. CI runs the same four as
required checks.

## Where code goes

The server is moving to a domain-driven design implemented as a hexagonal architecture (ports and
adapters). `ARCHITECTURE.md` describes the target and the dependency rules; follow it for all new
server code.

- `domain/`: the domain core. Entities, value objects, rules, authorization. It must not import Nuxt,
  Nitro, Firebase or anything under `server/`; `tests/architecture.spec.ts` enforces it. New
  business rules go here.
- `application/`: use cases and the ports (interfaces) they need. Imports only `domain/` and
  `application/`.
- `server/adapters/`: port implementations, one directory per store (`memory/`, later `rtdb/`).
  Each runs its port's contract suite from `tests/application/`.
- `server/api/v1/`: the current API. Handlers still call Firebase directly; that is being replaced,
  not extended. Do not add new business logic to a v1 handler.
- `server/middleware/`, `server/utils/`: request pipeline and shared server helpers.
- `pages/`, `components/`, `layouts/`, `stores/`, `composables/`: the Vue front end.
- `models/`: old interfaces that have drifted from the data (#543). Prefer types from `domain/`.
- `tests/`: all tests, mirroring the source path (`domain/user.ts` → `tests/domain/user.spec.ts`).
  Vitest only looks here.

The target layout, and how to place code while both shapes exist, is in `ARCHITECTURE.md`.

## Conventions

- **API handlers** record what they do for the wide-event log: `setResourceContext` once, then
  `addEventContext` for useful fields, and `setErrorContext` before every `throw createError(...)`.
  Error codes are `area/kebab-case` and the status message is `Error (<code>).`. Describe each
  endpoint with `defineRouteMeta` as the wiki's "Adding an API endpoint" page shows.
- **Errors in new code**: add the code to `domain/errors/catalog.ts` and `throw fail(code)`. Do not
  call `setErrorContext` or `createError` for it; the error boundary in `server/errors/` logs it and
  builds the response from the catalogue. Pass the underlying error as `cause` instead of logging it.
- **API design** follows the wiki's "API conventions" page. Open questions for v2 are on "API v2
  decisions"; do not settle them silently in code.
- **Imports**: import from another directory through the `@/` alias for the project root
  (`@/domain/time`), not with `../`. `./` is for files in the same directory. ESLint enforces it.
- **Types**: use the branded types in `domain/` (`Instant`, `Term`, `EmailAddress`, `HttpUrl`,
  `MapLink`, ...) and their `parse`/`tryParse` functions at boundaries. Only the owning module casts to a brand.
- **Authorization**: decide with `authorize()` from `domain/authorization/authorize.ts`, which asks the
  permission table and raises the only refusals (401 `auth/signed-out`, 403 `auth/forbidden`). Use
  `hasPermission` only where a denial narrows a result instead of refusing. Never check `userType`,
  `companyUID` or `cvAccess` in a handler; the subject carries roles and entitlements.
- **New UI** (the admin pages first) uses shadcn-vue components from `components/ui`, Tailwind
  classes with the `tw:` prefix and Lucide icons, never Vuetify. After `bunx shadcn-vue add`, check
  the result: the CLI leaves class lists in template strings unprefixed, sometimes prefixes plain
  string values such as `'popper'`, imports `cn` from a `cn`
  package instead of `@/lib/utils`, and may bump dependencies such as `@vueuse/core`. Do not use
  `!important` (or Tailwind's `!` suffix); fix the conflicting rule instead.
- **Translations**: user-facing text goes in both `i18n/locales/en-GB.json` and `nb-NO.json`.
- **Comments**: TSDoc on exported domain types and functions, explaining why. No comments that
  restate the code.

## Git and pull requests

- Branch off `dev`. Name branches `feature/<issue>-<title>`, `fix/...`, `refactor/...`, `docs/...`, `ci/...`.
- Commit messages and pull request titles are Conventional Commits with the types in
  `commitlint.config.mjs` (`feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `chore`, ...).
- Keep pull requests small, ideally under ~400 changed lines. Large ones wait weeks for review.
- Pull requests into `dev` are squash-merged and need one approval; changes to `.github/workflows/`
  need a manager's. The only exception to squashing is syncing `prod` back into `dev`, which must be
  a merge commit (`gh pr merge <n> --merge`).
- Never merge with `--admin` or another rule bypass unless a human explicitly asks for it.
- Releases do not go through pull requests into `prod`; see the README's Deployment section.
- Fill in the pull request template, and keep the description true to the diff.

## Safety

- The repository is public. Never describe a security problem in an issue, pull request, commit or
  the wiki. Report it privately; see `SECURITY.md`.
- Never commit secrets: `.env*` files and `*.key.json` service-account keys are git-ignored and must
  stay that way.
- Do not push to `dev` or `prod` directly, and do not change rulesets, environments or deploy keys
  without being asked.

## Documentation map

- `README.md`: setup, commands, contributing, deployment.
- `ARCHITECTURE.md`: layers, dependency rules, request flow, where the migration stands.
- Wiki: concepts and decisions (access control, DDD, API conventions, glossary).
- Generated reference (docs.etdagen.no): endpoints and types, built from the code. Do not copy
  reference material into the wiki or markdown files; it goes stale.
- Plans and work tracking: GitHub milestones and issues. Agent-written plans stay out of git.
