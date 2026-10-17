# Copilot instructions

Follow [`CLAUDE.md`](../CLAUDE.md) and [`ARCHITECTURE.md`](../ARCHITECTURE.md); they apply to every
coding agent in this repository.

When reviewing pull requests, check in particular:

- `domain/` imports nothing from Nuxt, Nitro, Firebase or `server/`.
- New business rules are not added to `server/api/v1` handlers.
- Handlers call `setErrorContext` before each `throw createError(...)`, with an `area/kebab-case` code.
- Authorization is checked inside every handler that needs it, whatever the generated docs show.
- User-facing text exists in both `i18n/locales/en-GB.json` and `nb-NO.json`.
- Tests sit under `tests/`, mirroring the source path.
- The pull request description matches the diff.

Do not describe security problems in review comments; point the author to `SECURITY.md`.
