/**
 * List companies that look like the same company stored more than once
 *
 * Read only. Groups companies by name, ignoring case, punctuation and suffixes such as AS, ASA
 * and Norge, and shows for each entry its tier and how much points at it: events (with the
 * years they ran), jobs, users, registration codes, memberships and files. Prints counts, never
 * who the users are.
 *
 *   bun --env-file=.env scripts/find-duplicate-companies.ts
 *
 * Reads the same NUXT_FIREBASE_ADMIN_* variables as the server, or runs against the emulators when
 * FIREBASE_DATABASE_EMULATOR_HOST is set.
 */
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'

const env = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

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
  databaseURL: env('NUXT_PUBLIC_FIREBASE_DATABASE_URL'),
  storageBucket: env('NUXT_FIREBASE_ADMIN_STORAGE_BUCKET').replace(
    /^gs:\/\//,
    '',
  ),
})
const db = getDatabase(app)

type Stored = Record<string, Record<string, unknown>>
const read = async (path: string) =>
  ((await db.ref(path).once('value')).val() ?? {}) as Stored

const [companies, events, jobs, users, codes, memberships, files] =
  await Promise.all(
    [
      'companies',
      'events',
      'jobs',
      'users',
      'registrationCodes',
      'memberships',
      'files',
    ].map(read),
  )
const [stored] = await getStorage(app)
  .bucket()
  .getFiles({ prefix: 'companies/' })

const SUFFIXES = /\b(as|asa|ab|ag|gmbh|ltd|inc|norge|norway|norden)\b/g
const keyOf = (name: unknown) =>
  String(name ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(SUFFIXES, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const pointingAt = (node: Stored, uid: string) =>
  Object.values(node).filter((record) => record?.companyUID === uid)

const yearsOf = (uid: string) => {
  const years = pointingAt(events, uid)
    .map((event) => {
      const date = event.date as { start?: string } | undefined
      return date?.start?.slice(0, 4)
    })
    .filter(Boolean)
  return [...new Set(years)].sort().join(',') || '-'
}

const groups = new Map<string, string[]>()
for (const [uid, company] of Object.entries(companies)) {
  const key = keyOf(company.name)
  groups.set(key, [...(groups.get(key) ?? []), uid])
}

const duplicates = [...groups.entries()]
  .filter(([, uids]) => uids.length > 1)
  .sort(([a], [b]) => a.localeCompare(b))

for (const [key, uids] of duplicates) {
  console.log(`\n${key}`)
  for (const uid of uids) {
    const company = companies[uid]!
    const counts = {
      events: pointingAt(events, uid).length,
      years: yearsOf(uid),
      jobs: pointingAt(jobs, uid).length,
      users: pointingAt(users, uid).length,
      codes: pointingAt(codes, uid).length,
      memberships: Object.values(memberships).filter((held) => held?.[uid])
        .length,
      fileRecords: Object.values(files).filter(
        (file) => file?.ownerKey === `company:${uid}`,
      ).length,
      storedFiles: stored.filter((file) =>
        file.name.startsWith(`companies/${uid}/`),
      ).length,
    }
    console.log(
      `  ${uid}  "${company.name}"  type=${company.type ?? '-'}  ` +
        `cvAccess=${company.cvAccess ?? '-'}  ${Object.entries(counts)
          .map(([name, value]) => `${name}=${value}`)
          .join(' ')}`,
    )
  }
}

console.log(
  `\n${Object.keys(companies).length} companies, ${duplicates.length} names stored more than once.`,
)
process.exit(0)
