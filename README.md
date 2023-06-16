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
