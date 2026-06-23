import { defineConfig } from 'vitest/config'

// Plain Vitest config — the server util tests are pure (no Nuxt runtime needed),
// so we avoid nuxt-vitest, which is deprecated and incompatible with Nuxt 3.21+.
// If component tests requiring a Nuxt environment are added later, migrate to
// @nuxt/test-utils and opt those files in with `// @vitest-environment nuxt`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.{test,spec}.ts'],
  },
})
