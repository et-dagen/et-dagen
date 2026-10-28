/**
 * Trim every company's logo and store it in the bucket
 *
 * Logos used to be stored as uploaded, or linked straight from the company's own site, often with
 * a wide empty margin that makes them look small on the landing page. This fetches each logo,
 * cuts the margin away as an upload through `PUT /api/v1/company/logo` does, stores it as the
 * company's logo file and points the company at it. A logo that already is the company's trimmed
 * file is skipped.
 *
 *   bun --env-file=.env.development scripts/trim-logos.ts           # dry run: fetch, trim, report
 *   bun --env-file=.env.development scripts/trim-logos.ts --apply   # store the trimmed logos
 *
 * SVG and GIF logos are drawn as PNG first. The old files in the bucket are left where they are;
 * the run lists them. Reads the same NUXT_FIREBASE_ADMIN_* variables as the server, or runs
 * against the emulators when FIREBASE_DATABASE_EMULATOR_HOST is set.
 */
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'
import sharp, { type Metadata } from 'sharp'
import { storeLogo } from '@/application/companies/logo'
import { LOGO } from '@/domain/business/company'
import { storagePathOf } from '@/domain/files/file'
import { Instant } from '@/domain/time'
import { firebaseFileStorage } from '@/server/adapters/firebase/fileStorage'
import { rtdbCompanyRepository } from '@/server/adapters/rtdb/companyRepository'
import { rtdbFileRepository } from '@/server/adapters/rtdb/fileRepository'
import { sharpImageProcessor } from '@/server/adapters/sharp/imageProcessor'

const env = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const apply = process.argv.includes('--apply')
const emulated = Boolean(process.env.FIREBASE_DATABASE_EMULATOR_HOST)
const app = initializeApp({
  ...(emulated
    ? { projectId: env('NUXT_FIREBASE_ADMIN_PROJECT_ID') }
    : {
        credential: cert({
          projectId: env('NUXT_FIREBASE_ADMIN_PROJECT_ID'),
          clientEmail: env('NUXT_FIREBASE_ADMIN_CLIENT_EMAIL'),
          privateKey: env('NUXT_FIREBASE_ADMIN_PRIVATE_KEY').replace(
            /\\n/g,
            '\n',
          ),
        } as ServiceAccount),
      }),
  storageBucket: env('NUXT_FIREBASE_ADMIN_STORAGE_BUCKET').replace(
    /^gs:\/\//,
    '',
  ),
  databaseURL: env('NUXT_PUBLIC_FIREBASE_DATABASE_URL'),
})

const bucket = getStorage(app).bucket()
const deps = {
  companies: rtdbCompanyRepository(getDatabase(app)),
  files: rtdbFileRepository(getDatabase(app)),
  storage: firebaseFileStorage(bucket),
  images: sharpImageProcessor(),
  now: Instant.now,
}

const ownBucket = `https://storage.googleapis.com/${bucket.name}/`

/** Bytes behind a link; files in our bucket are read directly, since some are not public */
async function download(link: string): Promise<Uint8Array> {
  if (link.startsWith(ownBucket)) {
    const path = decodeURIComponent(link.slice(ownBucket.length))
    return new Uint8Array((await bucket.file(path).download())[0])
  }
  const response = await fetch(link, { signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}

/** The logo's bytes as a type the upload takes; SVG and GIF are drawn as PNG */
async function fetchLogo(link: string) {
  const bytes = await download(link)
  if (bytes.byteLength > LOGO.maxBytes) throw new Error('larger than 10 MB')
  const { format } = await sharp(bytes).metadata()
  const types: Record<string, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  }
  if (format && types[format]) return { bytes, contentType: types[format] }
  const drawn = await sharp(bytes, { density: 300 }).png().toBuffer()
  return { bytes: new Uint8Array(drawn), contentType: 'image/png' }
}

const leftover: string[] = []
let trimmed = 0
let failed = 0

for (const company of await deps.companies.all()) {
  const link = await deps.companies.logoOf(company.uid)
  if (!link) continue
  const [current] = await deps.files.ofOwner(
    { kind: 'company', uid: company.uid },
    'logo',
  )
  if (current && deps.storage.publicUrl(storagePathOf(current)) === link) {
    console.log(`skip  ${company.name}: already trimmed`)
    continue
  }

  try {
    const logo = await fetchLogo(link)
    const cut = await deps.images.trim(logo.bytes, LOGO)
    if (!cut) throw new Error('not a picture')
    const [before, after] = await Promise.all(
      [logo.bytes, cut.bytes].map((bytes) => sharp(bytes).metadata()),
    )
    const size = (meta: Metadata) => `${meta.width}x${meta.height}`
    console.log(
      `${apply ? 'trim ' : 'would'} ${company.name}: ${size(before)} -> ${size(after)} ` +
        `(${new URL(link).host})`,
    )
    if (apply) {
      await storeLogo(deps, {
        uploader: null,
        company: company.uid,
        name: decodeURIComponent(
          new URL(link).pathname.split('/').pop() || 'logo',
        ),
        ...logo,
      })
      if (link.startsWith(ownBucket))
        leftover.push(link.slice(ownBucket.length))
    }
    trimmed++
  } catch (error) {
    failed++
    console.error(
      `FAIL  ${company.name}: ${(error as Error).message} (${link})`,
    )
  }
}

console.log(
  `${trimmed} logos ${apply ? 'trimmed and stored' : 'can be trimmed'}, ${failed} failed.${
    apply ? '' : ' Run again with --apply to store them.'
  }`,
)
if (leftover.length) {
  console.log('Old logo files left in the bucket:')
  for (const path of leftover) console.log(`  ${decodeURIComponent(path)}`)
}
process.exit(0)
