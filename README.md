# etdagen.no

The second version of the [E&T-dagen website](https://etdagen.no). This time built with Nuxt 3 instead of Django.

**_NB!_** _You can find further reading materials in the [Repository Wiki](https://github.com/et-dagen/et-dagen/wiki) if the content in this README is not satisfactory_

## Getting started

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

### Pre-requisites

- [Node.js](https://nodejs.org/en/) v22 or higher (see `.nvmrc`)
- [bun](https://bun.com/) 1.3.14 (see the `packageManager` field in `package.json`)

### Installation

Clone the repository using SSH:

```bash
git clone git@github.com:et-dagen/et-dagen.git
```

Install dependencies:

```bash
# Navigate to the project root
cd ./et-dagen

# Install dependencies
bun install
```

### Setup

Create a `.env` file in the project root by copying the `.env.example` file:

```bash
cp .env.example .env
cp .env.example .env.development
```

Missing environment variables in the `.env` file will be provided by the project manager.

### Development

Start the development server on `http://localhost:3000`

```bash
bun run dev
```

### Production

Locally preview production build:

```bash
bun run preview
```

### Checks

The same checks CI runs on every pull request can be run locally:

```bash
bun run lint       # eslint + prettier --check
bun run typecheck  # gating typecheck (see tsconfig.typecheck.json)
bun run test       # vitest
bun run build      # nuxt build
```

`bun run lintfix` fixes most lint and formatting failures in place.

### Deployment

Deploying means merging `dev` into `prod`. Open the release pull request with the release checklist pre-filled:

**[Open a release PR](https://github.com/et-dagen/et-dagen/compare/prod...dev?template=release.md&expand=1)**

The `?template=release.md` part matters — without it you get the ordinary feature template instead of the checklist.

A release requires:

- all four CI checks green,
- an approving review from a member of [@et-dagen/managers](https://github.com/orgs/et-dagen/teams/managers),
- every review conversation resolved,
- the checklist actually worked through, not just ticked.

Merge with a **merge commit**, never a squash. When it merges, the production build deploys automatically to Digital Ocean using their App Platform.

Control the deployment logs in [Digital Ocean Control Panel](https://cloud.digitalocean.com/apps).

## Development guidelines

### Issues

Issues should be created for all new features and bugs. The issue should be assigned to the person who will be working on it. The issue should be labeled with the appropriate label(s).

When deciding to work on a new issue, assign yourself to the issue and move it to the `In progress` column on the project board.

When opening a branch for the issue, click the `Create a branch` under `Development` on the GitHub issue page. Name the branch `feature/issue_number-issue-title-in-kebab-case`, and select `Checkout locally`. For example, if the issue number is 42 and the issue title is `Add a new page`, the branch should be named `feature/42-add-a-new-page`.

When the issue is completed, create a pull request and assign the pull request to the person who should review it. The issue should be moved to the `In review` column on the project board.

When the pull request is approved and CI is green, merge it into `dev` and close the issue.

### Branches

_NB! All branches created working on issues should be branched off of `dev`._

The project uses a two-branch flow:

- `dev` — the default branch and integration target. All feature work is merged here.
- `prod` — production. Only ever updated by a `dev` → `prod` pull request, which triggers the Digital Ocean deploy.

Both branches are protected: no force-pushes, no deletion, and no merging until CI is green. `dev` needs no approving review; `prod` needs one from @et-dagen/managers.

Merge `dev` → `prod` with a **merge commit**, not a squash. Squashing a release would give `prod` a commit sharing no ancestry with `dev`, and the two branches would then conflict on every subsequent release. Feature branches into `dev` should be squashed.

Branch naming conventions:

- `feature/issue_number-issue-title-in-kebab-case` - A branch for a new feature.
- `docs/...` - A branch for documentation.
- `fix/...` - A branch for a bug fix.
- `refactor/...` - A branch for refactoring.
- `chore/...` - A branch for miscellaneous tasks.
- _More may be added in the future._

### Commits

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). This is enforced, not just recommended — two [husky](https://github.com/typicode/husky) hooks run locally:

- `pre-commit` runs `lint-staged`, which applies `prettier --write` and `eslint --fix` to staged files.
- `commit-msg` runs `commitlint`, which rejects messages that do not parse as Conventional Commits. Allowed types are listed in `commitlint.config.mjs`.

Because feature branches are squash-merged, the **pull request title** becomes the commit subject on `dev` — so it must be conventional too. CI checks this and reports it, without blocking.

### Pull requests

- Pull requests should be created for all new features and bugs. The pull request should be assigned to the person who should review it. The pull request should be labeled with the appropriate label(s).
- A pull request cannot be merged until the `lint`, `typecheck`, `test` and `build` checks pass.

### Who can merge

Write access comes from organisation membership, not from per-person grants on this repository. In practice:

- **Organisation members** can review and merge into `dev`.
- **Members of @et-dagen/managers** can additionally approve a release into `prod`.
- **Everyone else** is welcome to fork the repository and open a pull request. Those PRs are automatically labelled `external-contribution`, and an approval from an external contributor does not satisfy the branch ruleset.

If you are contributing regularly and keep having to fork, ask an organisation owner to add you to the organisation.

## Testing

Tests run on [Vitest](https://vitest.dev/):

```bash
bun run test        # single run, as CI does it
bun run test:watch  # watch mode
```

Coverage today is limited to pure server utilities (`server/**/*.{test,spec}.ts`) — see `vitest.config.mjs`. Component and composable tests need a Nuxt runtime environment via `@nuxt/test-utils`, which is not set up yet.

### Type checking

There are two typecheck commands, and the split is deliberate:

- `bun run typecheck` checks the plain-TypeScript surface (`server/`, `stores/`, `composables/`, `middleware/`, `plugins/`, …). It is clean, and **CI blocks merges on it**.
- `bun run typecheck:full` additionally checks Vue SFCs with `vue-tsc`. These carry pre-existing type errors that predate any typechecking in this repo, so it cannot be a plain pass/fail gate yet.

Instead CI runs `typecheck:full` as a **ratchet**: it passes while the error count stays at or below the number recorded in `.github/typecheck-baseline.txt`, and fails only if a change _adds_ errors. When you fix some, lower the baseline to match. When it reaches zero, fold the SFC surface into the gating command and delete the job.
