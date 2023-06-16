# E&T-dagen v2
The second version of the [E&T-dagen website](https://etdagen.no). This time built with Nuxt 3 instead of Django.

## Getting started

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

### Pre-requisites

- [Node.js](https://nodejs.org/en/) (v16.11.0 or higher)
- [npm](https://www.npmjs.com/) (v7.24.0 or higher)

### Installation

Clone the repository using SSH:

```bash
git clone
```

Install dependencies:

```bash
# Navigate to the project root
cd ./etdagen-v2

# Install dependencies
npm install
```

### Setup

Create a `.env` file in the project root by copying the .env.example file:

```bash
cp .env.example .env
```

Replace `xxxxx` in the `.env` file with the correct value: *d1f82*.

Add missing environment variables to the `.env` file, provided by the project manager.

### Development

Start the development server on `http://localhost:3000`

```bash
npm run dev
```

### Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Development guidelines

### Issues

Issues should be created for all new features and bugs. The issue should be assigned to the person who will be working on it. The issue should be labeled with the appropriate label(s).

When deciding to work on a new issue, assign yourself to the issue and move it to the `In progress` column on the project board.

When opening a branch for the issue, click the `Create a branch` under `Development` on the GitHub issue page. Name the branch `feature/issue_number-issue-title-in-kebab-case`, and select `Checkout locally`. For example, if the issue number is 42 and the issue title is `Add a new page`, the branch should be named `feature/42-add-a-new-page`.

When the issue is completed, create a pull request and assign the pull request to the person who should review it. The issue should be moved to the `In review` column on the project board.

When the pull request is approved, merge it into the `main` branch and close the issue.

### Branches
*NB! All branches created working on issues should be branched off of `main`.*

The project uses the following branch naming conventions:

- `main` - The main branch. This branch is protected and requires a pull request to be merged.
- `feature/issue_number-issue-title-in-kebab-case` - A branch for a new feature.
- `docs/...` - A branch for documentation.
- `fix/...` - A branch for a bug fix.
- `refactor/...` - A branch for refactoring.
- `chore/...` - A branch for miscellaneous tasks.
- *More may be added in the future.*


### Commits

- See [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/#summary) conventions for commit messages.

- The projects has been configured with a [husky pre-commit](https://github.com/typicode/husky) hook that runs `npm run lintfix` before every commit. This ensures that the code style is consistent.

### Pull requests

- Pull requests should be created for all new features and bugs. The pull request should be assigned to the person who should review it. The pull request should be labeled with the appropriate label(s).

## Deployment

*To be improved.*

## Testing

*To be improved.*