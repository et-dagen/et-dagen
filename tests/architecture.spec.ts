/**
 * Keeps the hexagon's dependency rules (ARCHITECTURE.md): the core knows nothing about Nitro,
 * Firebase or the adapters, so an adapter can be swapped without touching it.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(import.meta.dirname, '..')

const ALLOWED: Record<string, readonly string[]> = {
  domain: ['domain'],
  application: ['domain', 'application'],
  // request and form schemas, shared by the browser and the server
  contracts: ['domain', 'contracts', 'zod'],
}

const sourceFiles = (dir: string): string[] =>
  (existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' })
    : []
  )
    .filter((file) => file.endsWith('.ts'))
    .map((file) => join(dir, file))

/** `from 'x'`, `import 'x'` and `import('x')`, in single or double quotes */
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g

/** The top-level directory an import resolves to, or the package name */
function target(file: string, specifier: string): string {
  if (specifier.startsWith('@/') || specifier.startsWith('~/')) {
    return specifier.slice(2).split('/')[0]
  }
  if (specifier.startsWith('.')) {
    const path = relative(ROOT, resolve(ROOT, file, '..', specifier))
    return path.split('/')[0]
  }
  return specifier
}

describe.each(Object.entries(ALLOWED))('%s/', (layer, allowed) => {
  it(`imports only from ${allowed.join(' and ')}`, () => {
    const violations = sourceFiles(layer).flatMap((file) =>
      [...readFileSync(join(ROOT, file), 'utf8').matchAll(IMPORT)]
        .map(([, specifier]) => specifier)
        .filter((specifier) => !allowed.includes(target(file, specifier)))
        .map((specifier) => `${file} imports ${specifier}`),
    )
    expect(violations).toEqual([])
  })
})
