/**
 * Keeps the hexagon's dependency rules (ARCHITECTURE.md): the core knows nothing about Nitro,
 * Firebase or the adapters, so an adapter can be swapped without touching it. The front end's
 * imports run one way too: pages use components, components use `components/ui`, and `lib/` stays
 * plain TypeScript that needs neither Vue nor Nuxt.
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

const sourceFiles = (dir: string, extensions = ['.ts']): string[] =>
  (existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' })
    : []
  )
    .filter((file) => extensions.some((extension) => file.endsWith(extension)))
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

const FRONT_END = ['components', 'composables', 'layouts', 'pages', 'stores']

/** Every import in the given files, as `file imports specifier` when `refused` says so */
const importsWhere = (
  files: string[],
  refused: (file: string, specifier: string) => boolean,
) =>
  files.flatMap((file) =>
    [...readFileSync(join(ROOT, file), 'utf8').matchAll(IMPORT)]
      .map(([, specifier]) => specifier)
      .filter((specifier) => refused(file, specifier))
      .map((specifier) => `${file} imports ${specifier}`),
  )

describe('front end', () => {
  const vueAndTs = FRONT_END.flatMap((dir) => sourceFiles(dir, ['.ts', '.vue']))

  it('imports no page; a page another one needs belongs in a component', () => {
    expect(
      importsWhere(vueAndTs, (_file, specifier) =>
        /^[@~]\/pages\//.test(specifier),
      ),
    ).toEqual([])
  })

  it('is not imported by the server', () => {
    expect(
      importsWhere(sourceFiles('server'), (file, specifier) =>
        FRONT_END.includes(target(file, specifier)),
      ),
    ).toEqual([])
  })

  it("keeps components out of other areas' folders, except the shared ones", () => {
    const SHARED = ['ui', 'common', 'form']
    const areaOf = (path: string) => path.split('/')[1]
    expect(
      importsWhere(
        sourceFiles('components', ['.vue', '.ts']),
        (file, specifier) => {
          const imported = specifier.match(/^[@~]\/(components\/.+)$/)?.[1]
          if (!imported) return false
          const area = areaOf(imported)
          return !SHARED.includes(area) && area !== areaOf(file)
        },
      ),
    ).toEqual([])
  })
})

/** Packages and directories that need Vue or Nuxt while running; `lib/` may use their types only */
const RUNTIME =
  /^(vue|vue-router|pinia|nuxt|#app|#imports|firebase|vee-validate)(\/|$)|^@nuxtjs\/|^[@~]\/(components|composables|layouts|pages|stores)\//

/** Calls to Vue's reactivity or to Nuxt's auto-imports, which `lib/` cannot make without an import */
const RUNTIME_CALL =
  /\b(use[A-Z]\w*|ref|computed|reactive|watch|watchEffect|on(Mounted|BeforeUnmount|Unmounted)|navigateTo|defineStore|createError|\$fetch)\s*\(/

describe('lib/', () => {
  const files = sourceFiles('lib')

  it('imports nothing that needs Vue or Nuxt at runtime, so it runs anywhere', () => {
    const STATEMENT = /\bimport\s+(type\s+)?[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g
    expect(
      files.flatMap((file) =>
        [...readFileSync(join(ROOT, file), 'utf8').matchAll(STATEMENT)]
          .filter(
            ([, typeOnly, specifier]) => !typeOnly && RUNTIME.test(specifier),
          )
          .map(([, , specifier]) => `${file} imports ${specifier}`),
      ),
    ).toEqual([])
  })

  it('calls no composable, reactivity or fetch; code that does is a composable', () => {
    expect(
      files.flatMap((file) =>
        readFileSync(join(ROOT, file), 'utf8')
          .split('\n')
          .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
          .filter((line) => RUNTIME_CALL.test(line))
          .map((line) => `${file}: ${line.trim()}`),
      ),
    ).toEqual([])
  })
})
