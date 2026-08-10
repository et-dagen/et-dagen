import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Plain Vitest config — the server util tests are pure (no Nuxt runtime needed),
// so we avoid nuxt-vitest, which is deprecated and incompatible with Nuxt 3.21+.
// If component tests requiring a Nuxt environment are added later, migrate to
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
    include: ['tests/**/*.{test,spec}.ts'],
  },
})
