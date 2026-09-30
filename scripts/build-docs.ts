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

const write = (name: string, document: object) => {
  writeFileSync(
    join(apiDir, `${name}.json`),
    `${JSON.stringify(document, null, 2)}\n`,
  )
  writeFileSync(join(apiDir, `${name}.yaml`), toYaml(document))
}

// The combined document stays the canonical download for tooling.
write('openapi', spec)

/**
 * Scalar renders one document per API version, chosen from a dropdown, rather
 * than merging every version into one sidebar where the v1 and v2 tags would
 * collide. Versions are derived from the paths themselves, so adding
 * /api/v2/** is enough for it to show up - neither this script nor the page
 * template needs editing.
 */
const versionOf = (path: string) =>
  path.match(/^\/api\/(v\d+)\//)?.[1] ?? 'other'

const versions = new Map<string, Record<string, unknown>>()
for (const [path, item] of Object.entries(paths)) {
  const version = versionOf(path)
  if (!versions.has(version)) versions.set(version, {})
  versions.get(version)![path] = item
}

// Newest first, and it is the one that opens by default.
const ordered = [...versions.keys()].sort((a, b) =>
  b.localeCompare(a, undefined, { numeric: true }),
)

const sources = ordered.map((version, index) => {
  const label = version === 'other' ? 'Unversioned' : version
  write(`openapi-${version}`, {
    ...spec,
    info: { ...spec.info, title: `${spec.info.title} ${label}` },
    paths: versions.get(version),
  })
  return {
    slug: version,
    title: label,
    url: `./openapi-${version}.json`,
    default: index === 0,
  }
})

console.log(
  `› spec written: ${Object.keys(paths).length} paths across ` +
    `${sources.length} version(s): ${ordered.join(', ')}`,
)

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
  readFileSync(join(ROOT, 'docs', name), 'utf8')
    .replaceAll('{{BANNER}}', banner)
    .replaceAll('{{SOURCES}}', JSON.stringify(sources, null, 2))

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
