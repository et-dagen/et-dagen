# etdagen.no

The second version of the [E&T-dagen website](https://etdagen.no). This time built with Nuxt 3 instead of Django.

**_NB!_** _You can find further reading materials in the [Repository Wiki](https://github.com/et-dagen/et-dagen/wiki) if the content in this README is not satisfactory_

## Getting started

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

### Pre-requisites

- [Node.js](https://nodejs.org/en/) (v20.2.0 or higher)
- [pnpm](https://pnpm.io/installation) (v8.10.5 or higher)

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
pnpm install
```

### Setup

Create a `.env` file in the project root by copying the `.env.example` file:

```bash
cp .env.example .env
```

and

```bash
cp .env.example .env.development
```

and

```bash
cp .env.example .env.development
```

and

```bash
cp .env.example .env.development
```

Missing environment variables in the `.env` file will be provided by the project manager.

### Development

Start the development server on `http://localhost:3000`

```bash
pnpm dev
```

### Production

Locally preview production build:

```bash
pnpm preview
```

### Deployment

Create pull request from `dev` to `main` branch. When the pull request is approved and merged, the production build will be deployed automatically to Digital Ocean using their App Platform.

Control the deployment logs in [Digital Ocean Control Panel](https://cloud.digitalocean.com/apps).

## Development guidelines

### Issues

Issues should be created for all new features and bugs. The issue should be assigned to the person who will be working on it. The issue should be labeled with the appropriate label(s).

When deciding to work on a new issue, assign yourself to the issue and move it to the `In progress` column on the project board.

When opening a branch for the issue, click the `Create a branch` under `Development` on the GitHub issue page. Name the branch `feature/issue_number-issue-title-in-kebab-case`, and select `Checkout locally`. For example, if the issue number is 42 and the issue title is `Add a new page`, the branch should be named `feature/42-add-a-new-page`.

When the issue is completed, create a pull request and assign the pull request to the person who should review it. The issue should be moved to the `In review` column on the project board.

When the pull request is approved, merge it into the `main` branch and close the issue.

### Branches

_NB! All branches created working on issues should be branched off of `main`._

The project uses the following branch naming conventions:

- `main` - The main branch. This branch is protected and requires a pull request to be merged.
- `feature/issue_number-issue-title-in-kebab-case` - A branch for a new feature.
- `docs/...` - A branch for documentation.
- `fix/...` - A branch for a bug fix.
- `refactor/...` - A branch for refactoring.
- `chore/...` - A branch for miscellaneous tasks.
- _More may be added in the future._

### Commits

- See [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/#summary) conventions for commit messages.

- The projects has been configured with a [husky pre-commit](https://github.com/typicode/husky) hook that runs `pnpm lintfix` before every commit. This ensures that the code style is consistent.

### Pull requests

- Pull requests should be created for all new features and bugs. The pull request should be assigned to the person who should review it. The pull request should be labeled with the appropriate label(s).

## Testing

_To be improved._
