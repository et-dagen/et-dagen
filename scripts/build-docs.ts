/**
 * Builds the static documentation site for one git ref into DOCS_OUT.
 *
 * Run identically by hand and by .github/workflows/docs.yml, so anything that
 * breaks in CI reproduces locally with `bun run docs:build`.
 *
 * Env:
 *   DOCS_OUT      output directory            (default: docs-dist)
 *   DOCS_VERSION  info.version in the spec    (default: local)
 *   DOCS_SERVER   servers[0].url in the spec  (default: https://etdagen.no)
 *   DOCS_LABEL    banner text, e.g. "next"    (default: none)
 */
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stringify as toYaml } from 'yaml'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, process.env.DOCS_OUT ?? 'docs-dist')
const VERSION = process.env.DOCS_VERSION ?? 'local'
const SERVER = process.env.DOCS_SERVER ?? 'https://etdagen.no'
const LABEL = process.env.DOCS_LABEL ?? ''

const run = (cmd: string, args: string[], env: NodeJS.ProcessEnv = {}) => {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with ${res.status}`)
  }
}

/**
 * The prerender boots Nitro, and server/utils/firebase.ts calls cert() at
 * import time, which parses the PEM. It never *uses* the key - the prerendered
 * routes make zero Firebase calls - so a throwaway key is enough when no real
 * credentials are present. This is what lets CI run without any secrets.
 */
const firebaseFallback = (): NodeJS.ProcessEnv => {
  if (process.env.NUXT_FIREBASE_ADMIN_PRIVATE_KEY) return {}
  console.log('› no Firebase credentials found, generating a throwaway key')
  const key = spawnSync('openssl', ['genrsa', '2048'], { encoding: 'utf8' })
  if (key.status !== 0) throw new Error('openssl genrsa failed')
  return {
    NUXT_FIREBASE_ADMIN_TYPE: 'service_account',
    NUXT_FIREBASE_ADMIN_PROJECT_ID: 'docs-build',
    NUXT_FIREBASE_ADMIN_CLIENT_EMAIL:
      'docs-build@docs-build.iam.gserviceaccount.com',
    NUXT_FIREBASE_ADMIN_PRIVATE_KEY: key.stdout
      .trimEnd()
      .split('\n')
      .join('\\n'),
    NUXT_FIREBASE_ADMIN_STORAGE_BUCKET: 'docs-build.appspot.com',
    NUXT_PUBLIC_FIREBASE_DATABASE_URL:
      'https://docs-build.europe-west1.firebasedatabase.app',
  }
}

// 1 — generate the spec by prerendering it out of the Nitro build
console.log('› building Nuxt with DOCS_BUILD=true')
run('bunx', ['nuxt', 'build'], {
  DOCS_BUILD: 'true',
  DOCS_VERSION: VERSION,
  ...firebaseFallback(),
})

const rawPath = join(ROOT, '.output/public/_openapi.json')
if (!existsSync(rawPath)) {
  throw new Error(
    `${rawPath} missing. The prerender did not emit the spec - check that ` +
      'nitro.openAPI.production is enabled for DOCS_BUILD builds.',
  )
}

// 2 — trim and correct the generated spec
const raw = JSON.parse(readFileSync(rawPath, 'utf8'))

// Nitro documents every server route it knows about, including its own
// /_openapi.json and the app's page routes. Only the versioned API ships.
const paths = Object.fromEntries(
  Object.entries(raw.paths).filter(([path]) => path.startsWith('/api/')),
)

// servers[0] is derived from the prerender's own origin, so it always comes
// out as http://localhost. Point it at the real deployment instead.
const spec = {
  ...raw,
  servers: [{ url: SERVER, description: 'Production' }],
  paths,
}

const apiDir = join(OUT, 'api')
rmSync(OUT, { recursive: true, force: true })
mkdirSync(apiDir, { recursive: true })

writeFileSync(
  join(apiDir, 'openapi.json'),
  `${JSON.stringify(spec, null, 2)}\n`,
)
writeFileSync(join(apiDir, 'openapi.yaml'), toYaml(spec))
console.log(`› spec written: ${Object.keys(paths).length} paths`)

// 3 — self-host the Scalar bundle; nothing is loaded from a CDN
cpSync(
  join(ROOT, 'node_modules/@scalar/api-reference/dist/browser'),
  join(apiDir, 'scalar'),
  { recursive: true },
)

const banner = LABEL
  ? `<div class="banner">Unreleased — built from <code>${LABEL}</code>. ` +
    `<a href="../">Stable docs</a></div>`
  : ''

const template = (name: string) =>
  readFileSync(join(ROOT, 'docs', name), 'utf8').replaceAll(
    '{{BANNER}}',
    banner,
  )

writeFileSync(join(apiDir, 'index.html'), template('api.html'))
writeFileSync(join(OUT, 'index.html'), template('index.html'))

// 4 — source reference
console.log('› running typedoc')
run('bunx', ['typedoc', '--out', join(OUT, 'code')])

// GitHub Pages needs .nojekyll or it drops directories beginning with _
writeFileSync(join(OUT, '.nojekyll'), '')

// Publishing a CNAME before its DNS record exists takes the site OFFLINE:
// GitHub adopts the custom domain and redirects the github.io URL to a host
// that does not resolve, so both addresses break until DNS catches up. The
// domain is therefore opt-in, and stays off until someone deliberately turns
// it on. See the DOCS_DOMAIN block in .github/workflows/docs.yml for the
// switch-over order.
//
// docs/CNAME is the single source of the hostname - edit that one file to
// move the docs to etdagene.no later.
if (!LABEL && process.env.DOCS_DOMAIN === 'true') {
  cpSync(join(ROOT, 'docs/CNAME'), join(OUT, 'CNAME'))
  console.log('› CNAME published')
}

console.log(`\n✔ docs built into ${OUT}`)
