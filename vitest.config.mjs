import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Plain Vitest config — the server util tests are pure (no Nuxt runtime needed).
// If component tests requiring a Nuxt environment are added later, add
// @nuxt/test-utils and opt those files in with `// @vitest-environment nuxt`.
export default defineConfig({
  // Tests live under tests/, mirroring the source tree, and reach their subject through the
  // same `@/` alias Nuxt provides — so a test's imports do not change when it moves.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      '~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/**/*.{test,spec}.ts'],
          exclude: ['tests/api/**'],
        },
      },
      // Black-box tests of the HTTP API against a production build and the Firebase emulators.
      // Run with `bun run test:api`, which also runs the files one at a time: they share one
      // database, and `fileParallelism` has no effect inside a project.
      {
        extends: true,
        test: {
          name: 'api',
          include: ['tests/api/**/*.test.ts'],
          globalSetup: ['tests/api/support/server.ts'],
          testTimeout: 15_000,
        },
      },
    ],
  },
})
